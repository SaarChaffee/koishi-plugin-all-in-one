import { Context, Logger, Schema, Service } from 'koishi'
import { } from '@koishijs/assets'
import { } from '@koishijs/plugin-server'

const logger = new Logger('all-in-one')

declare module 'koishi' {
  interface Context {
    allInOne: AllInOne
  }
}

export const inject = {
  required: ['server']
}

export interface Config {
  urls: string[],
  rss: string
}

export const Config: Schema<Config> = Schema.object({
  urls: Schema.array(Schema.string()).default([]).description('tracker list'),
  rss: Schema.string().default('').description('mikan rss proxy')
})

class AllInOne extends Service {
  private config: Config

  constructor(ctx: Context, config: Config) {
    super(ctx, 'allInOne', true)
    this.config = config
  }

  async getTrackerList(): Promise<string> {
    let promises: Promise<string>[] = []

    for (const url of this.config.urls) {
      promises.push(this.ctx.http.get(url))
    }

    return Array.from(new Set(
      (await Promise.all(promises))
        .map((resp) => resp.split(/\n\n|\n/).filter((str: string) => str.length > 0)).flat())
    ).join('\n')
  }

  async getMikanRSS(): Promise<string> {
    return this.ctx.http.get(this.config.rss)
  }
}

export function apply(ctx: Context, config: Config) {
  ctx.plugin(AllInOne, config)
  ctx.inject(['allInOne'], (ctx) => {
    if (config.urls.length > 0) {
      ctx.server.get('/trackerlist', async (cc, next) => {
        const resp = await ctx.allInOne.getTrackerList()
        if (resp.length > 0) {
          cc.status = 200
          cc.type = 'text'
          return cc.body = resp
        } else {
          cc.status = 500
          cc.type = 'text'
          return cc.body = 'error'
        }
      })
    }

    if (config.rss.length > 0) {
      ctx.server.get('/rss', async (cc, next) => {
        const resp = await ctx.allInOne.getMikanRSS()
        if (resp.length > 0) {
          cc.status = 200
          cc.type = 'text'
          return cc.body = resp
        } else {
          cc.status = 500
          cc.type = 'text'
          return cc.body = 'error'
        }
      })
    }
  })
}
