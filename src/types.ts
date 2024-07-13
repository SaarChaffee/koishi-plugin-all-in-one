export interface RSSBody {
  rss: RSS
}

export interface RSS {
  $: Version
  channel: Channel[]
}

export interface Version {
  version: string
}

export interface Channel {
  title: string[]
  link: string[]
  description: string[]
  item: Item[]
}

export interface Item {
  guid: Guid[]
  link: string[]
  title: string[]
  description: string[]
  torrent: Torrent[]
  enclosure: Enclosure[]
}

export interface Guid {
  _: string
  $: IsPermaLink
}

export interface IsPermaLink {
  isPermaLink: string
}

export interface Torrent {
  $: XMLNS
  link: string[]
  contentLength: string[]
  pubDate: string[]
}

export interface XMLNS {
  xmlns: string
}

export interface Enclosure {
  $: EnclosureAttributes
}

export interface EnclosureAttributes {
  type: string
  length: string
  url: string
}
