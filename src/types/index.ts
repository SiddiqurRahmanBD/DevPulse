export type AuthUser = {
  id: number;
  role: "maintainer" | "contributor";
};

export type User = {
  id: number;
  name: string;
  role: string;
  iat: number;
  exp: number;
};
