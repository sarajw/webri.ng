import { getRepository } from 'typeorm';
import { logger } from '../..';
import { emailNotUniqueError, usernameNotUniqueError } from '../../../api/api-error-response';
import { User } from '../../../model';
import { EmailNotUniqueError, UsernameNotUniqueError } from '../../error';
import { getUser, GetUserSearchField } from '../getUser';
import { hashPassword } from '../password';
import { sendRegistrationEmail } from './sendRegistrationEmail';

/**
 * Registers a new User.
 * Creates a new user entity, configures their password and sends them their
 * registration email.
 * @warning Errors generated by the username and password validation functions will be
 * propagated upwards to the caller.
 * @async
 * @param {string} username - The user's selected username.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's new password, in plaintext.
 * @returns The newly registered user entity.
 */
export async function register(username: string,
	email: string,
	password: string): Promise<User>
{
	/**
	 * 'Normalised' email address.
	 * This ensures that the email address is stored in a valid format.
	 */
	const normalisedEmail = User.normaliseEmailAddress(email);
	// Validate the normalised email address. Raises an exception on validation failure.
	User.validateEmailAddress(normalisedEmail);

	// Check whether a user already exists with the same email.
	let existingUser = await getUser(GetUserSearchField.Email, normalisedEmail);
	if (existingUser) {
		throw new EmailNotUniqueError(emailNotUniqueError.message, emailNotUniqueError.code,
			emailNotUniqueError.httpStatus);
	}

	/**
	 * 'Normalised' username.
	 * This ensures that the username is stored in a valid format.
	 */
	const normalisedUsername = User.normaliseUsername(username);
	// Validate user name. Raises an exception on validation failure.
	User.validateUsername(normalisedUsername);

	// Check whether a user already exists with the same username.
	existingUser = await getUser(GetUserSearchField.Username, normalisedUsername);
	if (existingUser) {
		throw new UsernameNotUniqueError(usernameNotUniqueError.message,
			usernameNotUniqueError.code, usernameNotUniqueError.httpStatus);
	}

	// Validate new password. Raises an exception on validation failure.
	User.validateNewPassword(password);

	/** The hashed version of the plaintext password provided. */
	const passwordHash = await hashPassword(password);

	/** The newly created user entity. */
	const newUser = await getRepository(User).save(new User(normalisedUsername,
		normalisedEmail, passwordHash));

	logger.info(`New user registered: '${username}' / '${email}'`);

	await sendRegistrationEmail(newUser);

	return newUser;
}
