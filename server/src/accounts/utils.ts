export type Account = {
  authentication: {
    signature: string;
    message: string;
  };
};
export const ACCOUNTS = {
  ID(owner: string) {
    return `${owner.toLowerCase()}`;
  },
};

export function recordAccount(
  env: Env,
  {
    owner,
    signature,
    message,
  }: { owner: string; signature: string; message: string },
) {
  env.ACCOUNTS.put(
    ACCOUNTS.ID(owner),
    JSON.stringify({ authentication: { signature, message } }),
  );
}
