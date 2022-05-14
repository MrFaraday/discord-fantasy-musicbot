import { Client, Message } from 'discord.js'
import { YoutubeApiError } from '../api/youtube-api'
import issueTracks from '../issue-tracks'
import SourceError from '../source-error'
import { SlashCommandBuilder } from '@discordjs/builders'
import GuildSession from '../guild-session'

const interactionName = 'play'

async function handler (
    this: Client,
    { message, guild, args }: MessageCommadHandlerParams
): Promise<void | Message> {
    if (!message.member) return

    const [mode, ...query] = args

    console.log('>', message.id, message.member.voice.channel?.type)
    console.log('>', message.id, mode, query)

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

        console.log('>', message.id, tracks)

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

async function interactionHandler (
    this: Client,
    { guild, interaction }: InterationHandlerParams
): Promise<void> {
    console.log(interaction)
    await Promise.resolve()
}

const slashConfig = new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play track or playlist from link')

interface ExecutorParams {
    changeIt: number
}

async function executor (guild: GuildSession, { changeIt }: ExecutorParams) {
    // executor
}

const command: MessageCommand<ExecutorParams> & SlashCommand<ExecutorParams> = {
    commandMessageNames: ['p', 'fp'],
    sort: 1,
    helpInfo:
        '`p [link]` play track(playlist) from link or add to queue\n`fp [link]` clear queue and play shuffled playlist or track immediately',
    messageHandler: handler,

    commandInteractionNames: [interactionName],
    slashConfig,
    interactionHandler,

    executor
}

export default command
