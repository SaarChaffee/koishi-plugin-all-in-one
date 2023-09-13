import { Context, Logger, Schema, Service } from 'koishi'
import { } from '@koishijs/assets'

const logger = new Logger('all-in-one')

declare module 'koishi' {
  interface Context {
    allInOne: AllInOne
  }
}

export interface Config {
  urls: string[]
}

export const Config: Schema<Config> = Schema.object({
  urls: Schema.array(Schema.string()).default([]).description('tracker list')
})

class AllInOne extends Service {
  private config: Config

  constructor(ctx: Context, config: Config) {
    super(ctx, 'allInOne', true)
    this.config = config
  }

  async get(): Promise<string> {
    let promises: Promise<string>[] = []

    for (const url of this.config.urls) {
      promises.push(this.ctx.http.get(url))
    }

    return Array.from(new Set(
      (await Promise.all(promises))
        .map((resp) => resp.split(/\n\n|\n/).filter((str: string) => str.length > 0)).flat())
    ).join('\n')
  }
}

export function apply(ctx: Context, config: Config) {
  ctx.plugin(AllInOne, config)

  ctx.router.get('/trackerlist', async (cc, next) => {
    const resp = await ctx.allInOne.get()
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
