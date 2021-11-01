import { Client, Message } from 'discord.js'
import youtubeApi from '../api/youtube-api'
import db from '../db'
import { isValidInteger } from '../utils/number'
import { shortString } from '../utils/string'

const urlRegEx =
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_+.~#?&//=]*)/

async function handler (
    this: Client,
    { guild, args, message }: CommadHandlerParams
): Promise<void | Message> {
    if (!message.guild) return

    const [, bindParam, url] = args

    const bindName = args.slice(3).join(' ')
    const bindKey = Number(bindParam)

    if (!bindParam) {
        return await message.channel.send('No params provided')
    } else if (!isValidInteger(bindKey, 0, 9)) {
        return await message.channel.send('Bind key must be an integer from 0 to 9')
    } else if (!url) {
        return await message.channel.send('No link provided')
    } else if (url.length > 500) {
        return await message.channel.send('Link is too long, maximum 500 of characters')
    } else if (!urlRegEx.test(url)) {
        return await message.channel.send('It\'s not a link, maybe')
    } else if (!(await youtubeApi.isSourceExist(url))) {
        return await message.channel.send(
            'Sorry, I followed a link and have found nothing'
        )
    } else if (bindName.length > 80) {
        return await message.channel.send('Name is too long, maximum 80 of characters')
    }

    const client = await db.getClient()
    const guildId = message.guild.id

    try {
        const [record] = (
            await client.query(
                `
                SELECT bind_key FROM bind
                WHERE guild_id = $1 AND bind_key = $2
                `,
                [guildId, bindKey]
            )
        ).rows

        if (record) {
            await client.query(
                `
                UPDATE bind SET bind_key = $2, bind_value = $3, bind_name = $4
                WHERE guild_id = $1 AND bind_key = $2
                `,
                [guildId, bindKey, url, bindName || null]
            )
        } else {
            await client.query(
                `
                INSERT INTO bind (guild_id, bind_key, bind_value, bind_name)
                VALUES ($1, $2, $3, $4)
                `,
                [guildId, bindKey, url, bindName || null]
            )
        }

        guild.binds.set(bindKey, { name: bindName || shortString(url), value: url })

        return await message.channel.send('Saved!')
    } catch (error) {
        console.log(error)
        return await message.channel.send('Something went wrong, I\'ll find that soon')
    } finally {
        client.release()
    }
}

export default {
    aliases: ['bind'],
    helpSort: 9,
    helpInfo:
        '`bind [0..9] [link] [name?]` bind link to number, rest of input will be name but it optional',
    handler
}
