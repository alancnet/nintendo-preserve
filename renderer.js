import ripc from 'ripc'
import { JSDOM } from 'jsdom'
const typo = { slash: '/', second: '.', percent: '%' }
const readTypo = e => Array.from(e.querySelectorAll('.typography')).map(x => Array.from(x.classList).find(x => x.startsWith('typography-')).split('-').pop()).map(x => typo[x] ?? x).join('')

ripc(process, {
  getLevels(html) {
    const dom = new JSDOM(html)
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

    return levels
  }
})