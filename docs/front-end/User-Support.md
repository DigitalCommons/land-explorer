Some user support tips and tricks.

# Manually resetting a user's password

It happens that there can be bugs in the password reset flow. In such a case we need to manually update a password.

The easiest way to do this is to set their password to `password1`:
1. `SELECT password FROM user WHERE username="password1_reset_template@fakedomain.coop"; ` this returns the encrypted hash of `password1` by selecting the dummy user that has been added to the database for this purpose
3. `UPDATE user SET password=<hashed value returned in step 1> WHERE username=<email>; ` to update the password of the real user
4. Confirm that 1 database record has updated as expected, and test logging in to the user with `password1`. If this fails, maybe the user signed up to LX with a different email address.
5. Let the user know their password has been reset, and how to change their password to something more secure.
