// ----------------------------------------------------------------------
// Профиль пользователя (GET/PATCH /users/me/profile)

export type IUserProfile = {
  first_name: string | null;
  last_name: string | null;
  patronymic: string | null;
  country: string | null;
};

export type IUserProfileUpdate = Partial<IUserProfile>;

// Смена email (PUT /users/me)
export type IUserEmailUpdate = {
  email: string;
  current_password: string;
};
