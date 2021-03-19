import axios from 'axios'
import { JSDOM } from 'jsdom'

async function main() {
  const res = await axios.get('https://wizul.us/nintendo/url')
  const url = res.data
  await doFetch(url, 1)

  axios({
    method: 'DELETE',
    url: 'https://wizul.us/nintendo/url',
    data: {
      url
    }
  })
}

const typo = { slash: '/', second: '.', percent: '%' }
const readTypo = e => Array.from(e.querySelectorAll('.typography')).map(x => Array.from(x.classList).find(x => x.startsWith('typography-')).split('-').pop()).map(x => typo[x] ?? x).join('')
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

async function doFetch (url, page = 1) {
  // https://supermariomakerbookmark.nintendo.net/search/result?utf8=%E2%9C%93&q%5Bskin%5D=mario_bros&q%5Bscene%5D=ground&q%5Barea%5D=us&q%5Bdifficulty%5D=normal&q%5Btag_id%5D=4&q%5Bcreated_at%5D=&q%5Bsorting_item%5D=clear_rate_asc
  console.log('Loading page...', Object.fromEntries(new URL(url).searchParams.entries()))
  const res = await axios.get(url)
  const dom = new JSDOM(res.data)
  const levels = Array.from(dom.window.document.querySelectorAll('.course-card:not(.seen)')).map(x => {
    try {
      x.classList.add('seen')
      const triedCount = readTypo(x.querySelector('.tried-count'))
      const courseImage = x.querySelector('img.course-image')
      const courseImageFull = x.querySelector('img.course-image-full')
      const medals = x.querySelector('.medals')
      const medalCount = readTypo(medals) || Array.from(medals.classList).pop().substr(16)
      return {
        type: 'NintendoSMM1Level',
        id: courseImage.getAttribute('alt'),
        title: x.querySelector('.course-title').textContent?.trim(),
        gameskin: Array.from(x.querySelector('.gameskin').classList).pop().substr(10),
        rank: x.querySelector('.course-header')?.textContent?.trim(),
        stars: +readTypo(x.querySelector('.liked-count')),
        tries: +triedCount.split('/').pop(),
        clears: +triedCount.split('/')[0],
        uploadedAt: x.querySelector('.created_at').textContent?.trim(),
        courseImage: courseImage.src,
        courseImageFull: courseImageFull.src,
        country: Array.from(x.querySelector('.flag').classList).pop(),
        creator: x.querySelector('.name').textContent?.trim(),
        creatorId: x.querySelector('.icon-mii img').alt.split(' ').shift(),
        creatorProfile: x.querySelector('.icon-mii').href.split('/').pop().split('?').shift(),
        mii: x.querySelector('.icon-mii img').src,
        medals: medalCount
      }
    } catch (err) {
      console.warn(err)
    }
  }).filter(x => x)

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