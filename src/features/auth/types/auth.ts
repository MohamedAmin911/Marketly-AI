export type AuthMode = "login" | "signup";

export type LoginPayload = {
  email: string;
  password: string;
  remember: boolean;
};

export type SignupPayload = LoginPayload & {
  name: string;
  company: string;
};
