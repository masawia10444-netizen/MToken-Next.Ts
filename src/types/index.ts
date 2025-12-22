export interface UserData {
  userId: string;
  citizenId: string;
  firstName: string;
  lastName: string;
  dateOfBirthString?: string;
  email?: string;
  notification?: string;
  mobile?: string;
  additionalInfo?: string;
}

export interface LoginResponse {
  status: 'found' | 'new_user' | 'error';
  message: string;
  data?: UserData;
}