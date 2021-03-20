import axios from 'axios'
import ripc from 'ripc'

async function main() {
  while (true) {
    const res = await axios.get('https://wizul.us/nintendo/url')
    const url = res.data
    await doFetch(url, 1)
    console.log('Done with', Object.fromEntries(new URL(url).searchParams.entries()))
    axios({
      method: 'DELETE',
      url: 'https://wizul.us/nintendo/url',
      data: {
        url
      }
    })
    await sleep(5000)
  }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

async function doFetch (url, page = 1) {
  // https://supermariomakerbookmark.nintendo.net/search/result?utf8=%E2%9C%93&q%5Bskin%5D=mario_bros&q%5Bscene%5D=ground&q%5Barea%5D=us&q%5Bdifficulty%5D=normal&q%5Btag_id%5D=4&q%5Bcreated_at%5D=&q%5Bsorting_item%5D=clear_rate_asc
  console.log('Loading page...', Object.fromEntries(new URL(url).searchParams.entries()))
  const res = await axios.get(url)
  const renderer = ripc('./renderer.js')
  const levels = await renderer.getLevels(res.data)
  renderer.close()

  const uncleared = levels.filter(x => x.clears === 0).length

  for (const level of levels) {
    console.log('Submitting level', level)
    await axios({
      method: 'POST',
      url: 'https://wizul.us/nintendo/level',
      data: level
    })
  }

  if (uncleared && page < 100) {
    const newUrl = new URL(url)
    newUrl.searchParams.set('page', page + 1)
    await sleep(5000)
    await doFetch(newUrl.toString(), page + 1)
  }

  console.log(levels)
}


main().catch(err => {
  console.error(err)
  process.exit(1)
})