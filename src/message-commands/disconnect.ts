import { Client } from 'discord.js'
import { SlashCommandBuilder } from '@discordjs/builders'
import MessageCommand from '../message-command'

async function handler (
    this: Client,
    { guild }: MessageCommadHandlerParams
): Promise<void> {
    guild.disconnect()

    return Promise.resolve()
}

const slashConfig = new SlashCommandBuilder().setName('disconnect')

export default new MessageCommand({
    aliases: ['d'],
    sort: 7,
    helpInfo: '`d` disconnect from a voice channel',
    slashConfig,
    handler
})
