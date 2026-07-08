SxS The Unreal V3 Member Authentication

What this version includes:
- Guild Member registration defaults on the signup page.
- Community User option available, but Guild Member is the default.
- Unique email, username, and in-game name checks.
- Guild Members must choose class: Guardian, Conqueror, Destroyer, Dominator.
- Rank order: Leader, Deputy, Officer, Member.
- Leader, Deputy, and Officer use the shared verification password.
- If the password is correct, they are auto-approved into that role.
- Member rank does not require the verification password.
- Sign In link appears on every page and turns into the player name after login.
- Roster reads registered Guild Members from D1.
- Profile page lets members edit their in-game name and class.

Required Cloudflare setup:
1. D1 binding name must be DB.
2. Secret must be named RANK_VERIFICATION_PASSWORD.
3. Current development verification password: Unreal Death.
4. Run db/schema.sql in the D1 console before testing registration.

Officer onboarding flow:
1. Officer visits account.html.
2. Leaves Guild Member selected.
3. Enters email, username, in-game name, class, password.
4. Chooses Leader, Deputy, or Officer.
5. Enters the verification password.
6. Account is created and they are signed in automatically.
7. Their name appears in the live Guild Roster.
