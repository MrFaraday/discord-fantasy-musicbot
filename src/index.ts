import { fireApp } from './app'
import db from './db'
import queries from './db/queries'

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error)
})

async function startup () {
    try {
        await db.query(queries.init)
        await fireApp()
    } catch (error) {
        console.error('Stratup error')
        console.error(error)
    }
}

void startup()