import { Context, Schema } from 'koishi'
import { Builder, parseString } from 'xml2js'

import * as MikanRSS from './types'
import type { } from '@koishijs/plugin-server'

export { MikanRSS }

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

export async function apply(ctx: Context, config: Config) {
  if (config.urls.length > 0) {
    ctx.server.get('/trackerlist', async (cc, next) => {
      let promises: Promise<string>[] = []

      for (const url of config.urls) {
        promises.push(ctx.http.get(url))
      }

      const resp = Array.from(new Set(
        (await Promise.all(promises))
          .map((resp) => resp.split(/\n\n|\n/).filter((str: string) => str.length > 0)).flat())
      ).join('\n')

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

  ctx.server.get('/rss', async (cc, next) => {
    const resp = await ctx.http.get(
      config.rss,
      {
        responseType: 'text',
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Content-Encoding': 'gzip'
        }
      }
    )
    if (resp.length > 0) {
      parseString(resp, async (err, xml: MikanRSS.RSSBody) => {
        if (err) {
          ctx.logger.error(err)
          cc.status = 500
          cc.type = 'text'
          cc.body = err
          return next()
        }
        xml.rss.channel[0].item.forEach((i) => {
          const url = i.enclosure[0].$.url
          const match = url.match(/\/(?<hash>[^\/]+)\.torrent$/)
          if (match) {
            const magnet = `magnet:?xt=urn:btih:${match.groups.hash}`
            i.enclosure[0].$.url = magnet
          }
        })

        const builder = new Builder()
        const resp = builder.buildObject(xml)
        cc.status = 200
        cc.type = 'application/xml; charset=utf-8'
        cc.body = resp
        return next()
      })
    } else {
      cc.status = 500
      cc.type = 'text'
      return cc.body = 'get mikan res error'
    }
  })
}
