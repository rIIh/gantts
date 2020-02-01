export interface UserState {
  user: firebase.User | null;
  isLoading: boolean;
  isFailed: boolean;
  message: string;
};

export interface AuthData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface SignUpData extends AuthData {
  fullName: string;
  company: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  userPic: string;
}