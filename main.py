"""Tarokk with the Firebase API"""

import base64
try:
    from functools import lru_cache
except ImportError:
    from functools32 import lru_cache
import json
import os
import re
import time
import urllib


import flask
from flask import request
from google.appengine.api import app_identity
from google.appengine.api import users
from google.appengine.ext import ndb
import httplib2
from oauth2client.client import GoogleCredentials

import bidding


_FIREBASE_CONFIG = '_firebase_config.html'

_IDENTITY_ENDPOINT = ('https://identitytoolkit.googleapis.com/'
                      'google.identity.identitytoolkit.v1.IdentityToolkit')
_FIREBASE_SCOPES = [
    'https://www.googleapis.com/auth/firebase.database',
    'https://www.googleapis.com/auth/userinfo.email']

app = flask.Flask(__name__)


# Memoize the value, to avoid parsing the code snippet every time
@lru_cache()
def _get_firebase_db_url():
    """Grabs the databaseURL from the Firebase config snippet. Regex looks
    scary, but all it is doing is pulling the 'databaseURL' field from the
    Firebase javascript snippet"""
    regex = re.compile(r'\bdatabaseURL\b.*?["\']([^"\']+)')
    cwd = os.path.dirname(__file__)
    try:
        with open(os.path.join(cwd, 'templates', _FIREBASE_CONFIG)) as f:
            url = next(regex.search(line) for line in f if regex.search(line))
    except StopIteration:
        raise ValueError(
            'Error parsing databaseURL. Please copy Firebase web snippet '
            'into templates/{}'.format(_FIREBASE_CONFIG))
    return url.group(1)


# Memoize the authorized http, to avoid fetching new access tokens
@lru_cache()
def _get_http():
    """Provides an authed http object."""
    http = httplib2.Http()
    # Use application default credentials to make the Firebase calls
    # https://firebase.google.com/docs/reference/rest/database/user-auth
    creds = GoogleCredentials.get_application_default().create_scoped(
        _FIREBASE_SCOPES)
    creds.authorize(http)
    return http


def _send_firebase_message(u_id, message=None):
    """Updates data in firebase. If a message is provided, then it updates
     the data at /channels/<channel_id> with the message using the PATCH
     http method. If no message is provided, then the data at this location
     is deleted using the DELETE http method
     """
    url = '{}/channels/{}.json'.format(_get_firebase_db_url(), u_id)

    if message:
        return _get_http().request(url, 'PATCH', body=message)
    else:
        return _get_http().request(url, 'DELETE')


def create_custom_token(uid, valid_minutes=60):
    """Create a secure token for the given id.
    This method is used to create secure custom JWT tokens to be passed to
    clients. It takes a unique id (uid) that will be used by Firebase's
    security rules to prevent unauthorized access. In this case, the uid will
    be the channel id which is a combination of user_id and game_key
    """

    # use the app_identity service from google.appengine.api to get the
    # project's service account email automatically
    client_email = app_identity.get_service_account_name()

    now = int(time.time())
    # encode the required claims
    # per https://firebase.google.com/docs/auth/server/create-custom-tokens
    payload = base64.b64encode(json.dumps({
        'iss': client_email,
        'sub': client_email,
        'aud': _IDENTITY_ENDPOINT,
        'uid': uid,  # the important parameter, as it will be the channel id
        'iat': now,
        'exp': now + (valid_minutes * 60),
    }))
    # add standard header to identify this as a JWT
    header = base64.b64encode(json.dumps({'typ': 'JWT', 'alg': 'RS256'}))
    to_sign = '{}.{}'.format(header, payload)
    # Sign the jwt using the built in app_identity service
    return '{}.{}'.format(to_sign, base64.b64encode(
        app_identity.sign_blob(to_sign)[1]))


class Game(ndb.Model):
    """All the data we store for a game"""
    user1 = ndb.UserProperty()
    user2 = ndb.UserProperty()
    user3 = ndb.UserProperty()
    user4 = ndb.UserProperty()
    current_player = ndb.UserProperty()
    state = ndb.JsonProperty()

    def to_json(self):
        d = self.to_dict()
        return json.dumps(d, default=lambda user: user.user_id())

    def _next_player(self):
        if self.current_player == self.user1:
            self.current_player = self.user2
        elif self.current_player == self.user2:
            self.current_player = self.user3
        elif self.current_player == self.user3:
            self.current_player = self.user4
        elif self.current_player == self.user4:
            self.current_player = self.user1

    def send_update(self):
        """Updates Firebase's copy of the board."""
        message = self.to_json()
        # send updated game state to user X
        _send_firebase_message(
            self.user1.user_id() + self.key.id(), message=message)
        # send updated game state to user O
        if self.user2:
            _send_firebase_message(
                self.user2.user_id() + self.key.id(), message=message)
        if self.user3:
            _send_firebase_message(
                self.user3.user_id() + self.key.id(), message=message)
        if self.user3:
            _send_firebase_message(
                self.user4.user_id() + self.key.id(), message=message)

    def make_bid(self, amount, user):
        # If the user is a player, and it's their move
        if (user in (self.user1, self.user2, self.user3, self.user4)) and (
                user == self.current_player):
            state = bidding.bid(self.state, amount)
            if state['status'] != 'forbidden':
                self.state = state
                self._next_player()
                self.put()
                self.send_update
            return


# [START move_route]
@app.route('/bid', methods=['POST'])
def move():
    game = Game.get_by_id(request.args.get('g'))
    amount = int(request.form.get('b'))
    if not game:
        return 'Game not found'
    game.make_bid(amount, users.get_current_user())
    return ''
# [END move_route]


# [START route_delete]
@app.route('/delete', methods=['POST'])
def delete():
    game = Game.get_by_id(request.args.get('g'))
    if not game:
        return 'Game not found', 400
    user = users.get_current_user()
    _send_firebase_message(user.user_id() + game.key.id(), message=None)
    return ''
# [END route_delete]


@app.route('/opened', methods=['POST'])
def opened():
    game = Game.get_by_id(request.args.get('g'))
    if not game:
        return 'Game not found', 400
    game.send_update()
    return ''


@app.route('/')
def main_page():
    """Renders the main page. When this page is shown, we create a new
    channel to push asynchronous updates to the client."""
    user = users.get_current_user()
    game_key = request.args.get('g')

    if not game_key:
        game_key = user.user_id()
        game = Game(id=game_key, user1=user, current_player = user, state={'previous_bids' : []})
        game.put()
    else:
        game = Game.get_by_id(game_key)
        if not game:
            return 'No such game', 404

        user_already_in_game = user == game.user1
        if not user_already_in_game and not game.user2:
            game.user2 = user
            game.put()
            user_already_in_game = True
        if not user_already_in_game and not game.user3:
            game.user3 = user
            game.put()
            user_already_in_game = True
        if not user_already_in_game and not game.user4:
            game.user4 = user
            game.put()
            user_already_in_game = True
        if not user_already_in_game:
            game_key = user.user_id()
            game = Game(id=game_key, user1=user, current_player = user, state={'previous_bids' : []})
            game.put()

    # [START pass_token]
    # choose a unique identifier for channel_id
    channel_id = user.user_id() + game_key
    # encrypt the channel_id and send it as a custom token to the
    # client
    # Firebase's data security rules will be able to decrypt the
    # token and prevent unauthorized access
    client_auth_token = create_custom_token(channel_id)
    _send_firebase_message(channel_id, message=game.to_json())

    # game_link is a url that you can open in another browser to play
    # against this player
    game_link = '{}?g={}'.format(request.base_url, game_key)

    # push all the data to the html template so the client will
    # have access
    template_values = {
        'token': client_auth_token,
        'channel_id': channel_id,
        'me': user.user_id(),
        'game_key': game_key,
        'game_link': game_link,
        'initial_message': urllib.unquote(game.to_json())
    }

    return flask.render_template('fire_index.html', **template_values)
    # [END pass_token]
