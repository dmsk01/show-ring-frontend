import { ProfileSettingsLayout } from 'src/sections/profile/profile-settings-layout';

// ----------------------------------------------------------------------

type Props = { children: React.ReactNode };

export default function Layout({ children }: Props) {
  return <ProfileSettingsLayout>{children}</ProfileSettingsLayout>;
}
