import { Room } from '../lib/do-verse/src/Room';
import { recordAccount } from './accounts/utils';

export class MeebitsRoom extends Room {
  // store the message amd signature, allowing it to be used to retrived meebits asset from meebits.app
  async onAccountValidated({
    owner,
    signature,
    message,
  }: {
    owner: string;
    signature: string;
    message: string;
  }): Promise<void> {
    await recordAccount(this.env, {
      owner,
      signature,
      message,
    });
  }
}
