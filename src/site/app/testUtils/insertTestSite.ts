import { Site, UUID } from '../../model';
import { getRepository } from 'typeorm';
import { createRandomString } from '../util';
import { createRandomSiteUrl } from '.';


/** Additional options for inserting a test site. */
export type InsertTestSiteOptions = {
	name?: Readonly<string>;
	url?: Readonly<string>;
	dateCreated?: Readonly<Date>;
}


/**
 * Inserts a site entity suitable for testing.
 * @param {UUID} webringId - The id of the parent webring.
 * @param {UUID} addedBy - The id of the adding user.
 * @param {InsertTestSiteOptions} [options] - Options for instantiating the test webring.
 * @returns The Webring entity
 */
export async function insertTestSite(webringId: Readonly<UUID>,
	addedBy: Readonly<UUID>,
	options: InsertTestSiteOptions = {}): Promise<Site>
{
	const name = options.name || Site.normaliseName(createRandomString());
	const url = options.url || createRandomSiteUrl();

	const newSite = new Site(name, url, webringId, addedBy);
	newSite.dateCreated = options.dateCreated || new Date();

	return getRepository(Site).save(newSite);
}
