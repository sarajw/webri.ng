import { getRepository } from 'typeorm';
import { logger } from '../';
import { emailNotUniqueError, usernameNotUniqueError,
	userNotFoundError } from '../../api/api-error-response';
import { User, UUID } from '../../model';
import { EmailNotUniqueError, UsernameNotUniqueError, UserNotFoundError } from '../error';
import { getUser, GetUserSearchField } from '.';

/**
 * Updates an existing user.
 * @warning Errors generated by the username and password validation functions will be
 * propagated upwards to the caller.
 * @async
 * @param {string} userId - The id of the user to update.
 * @param {string} username - The user's selected username.
 * @param {string} email - The user's email address.
 * @returns The updated user entity.
 */
export async function updateUser(userId: UUID,
	username: string,
	email: string): Promise<User>
{
	const user = await getUser(GetUserSearchField.UserId, userId);
	if (!user) {
		throw new UserNotFoundError(`User with id '${userId}' cannot be found`,
			userNotFoundError.code, userNotFoundError.httpStatus);
	}

	/**
	 * 'Normalised' email address.
	 * This ensures that the email address is stored in a valid format.
	 */
	const normalisedEmail = User.normaliseEmailAddress(email);
	// Validate the normalised email address. Raises an exception on validation failure.
	User.validateEmailAddress(normalisedEmail);

	// Check whether a user already exists with the same email.
	let existingUser = await getUser(GetUserSearchField.Email, normalisedEmail);
	if (existingUser && existingUser.userId !== userId) {
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
	if (existingUser && existingUser.userId !== userId) {
		throw new UsernameNotUniqueError(usernameNotUniqueError.message,
			usernameNotUniqueError.code, usernameNotUniqueError.httpStatus);
	}

	user.username = normalisedUsername;
	user.email = normalisedEmail;
	user.dateModified = new Date();

	logger.info(`Updating user id: '${userId}': '${username}' / '${email}'`);

	return getRepository(User).save(user);
}
