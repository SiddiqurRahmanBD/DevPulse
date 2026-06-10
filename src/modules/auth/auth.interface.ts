export interface IUser {
  name: string;
  email: string;
  password: string;
  role: "contributor " | "maintainer";
}

export interface IuserLogin {
  email: string;
  password: string;
}
