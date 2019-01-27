import { en } from './en';
import { hu } from './hu';

export class LanguageConfig {
  private _language = "hu";
  private available: {[key: string]: typeof hu.text} = {
    "hu": hu.text,
    "en": en.text
  }

  get text(): typeof hu.text {
    return this.available[this._language];
  }

  set language(value: string) {
    this.language = value;
  }
} 