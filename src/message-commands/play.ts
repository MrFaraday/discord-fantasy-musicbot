import { Client, Message } from 'discord.js'
import { YoutubeApiError } from '../api/youtube-api'
import issueTracks from '../issue-tracks'
import SourceError from '../source-error'
import { SlashCommandBuilder } from '@discordjs/builders'
import MessageCommand from '../message-command'

async function handler (
    this: Client,
    { message, guild, args }: MessageCommadHandlerParams
): Promise<void | Message> {
    if (!message.member) return

    const [mode, ...query] = args

    if (message.member.voice.channel?.type !== 'GUILD_VOICE') {
        return await message.channel.send('You are not connected to a voice channel')
    }

    if (query.length === 0) {
        return await message.channel.send('What to play?')
    }

    try {
        const { tracks, embed } = await issueTracks(query.join(' '))

        if (embed) {
            message.channel.send({ embeds: [embed] }).catch(() => 0)
        }

        if (mode === 'p') {
            return await guild.play(message.member.voice.channel, tracks, message.channel)
        } else if (mode === 'fp') {
            return await guild.forcePlay(
                message.member.voice.channel,
                tracks,
                message.channel
            )
        }
    } catch (error) {
        if (error instanceof SourceError) {
            return await message.channel.send(error.message)
        } else if (error instanceof YoutubeApiError && error.code === 404) {
            return await message.channel.send('Video not found')
        } else {
            console.warn('playHandler', error)
            return await message.channel.send('It\'s hidden or something went wrong')
        }
    }
}

const slashConfig = new SlashCommandBuilder().setName('play')

export default new MessageCommand({
    aliases: ['p', 'fp'],
    sort: 1,
    helpInfo:
        '`p [link]` play track(playlist) from link or add to queue\n`fp [link]` clear queue and play shuffled playlist or track immediately',
    slashConfig,
    handler
})
