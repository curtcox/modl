import { test, expect } from '@playwright/test';
const source = 'a square blue First\nb circle green Second\na -> b';
for (const width of [1440, 360]) test(`workspace views and compact controls at ${width}px`, async ({page}) => {
  await page.setViewportSize({width, height:800});
  await page.goto('./#h1='+Buffer.from(JSON.stringify({src:source,pos:{a:[120.25,120.5],b:[360.5,220.25]}})).toString('base64url'));
  await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  await expect(page.locator('.fk-toolbar #render')).toHaveCount(0);
  for (const [label, visible, hidden] of [['Text','.left','.right'],['Diagram','.right','.left']]) {
    await page.getByRole('tab',{name:label,exact:true}).click();
    await expect(page.locator(visible)).toBeVisible(); await expect(page.locator(hidden)).toBeHidden();
    const panel=await page.locator(visible).boundingBox(); expect(panel.width).toBe(width);
    await page.reload(); await expect(page.locator('body')).toHaveAttribute('data-ready','true');
    await expect(page.getByRole('tab',{name:label,exact:true})).toHaveAttribute('aria-selected','true');
    await expect(page.locator(hidden)).toBeHidden();
  }
  await page.getByRole('tab',{name:'Split',exact:true}).click();
  await expect(page.locator('.left')).toBeVisible(); await expect(page.locator('.right')).toBeVisible();
  expect(await page.locator('#src').inputValue()).toBe(source);
  expect((await page.evaluate(()=>ModlApp.getSnapshot())).pos.a).toEqual([120.25,120.5]);
  const header=await page.locator('.fk-header').boundingBox(); expect(header.height).toBeLessThan(width===360?130:75);
  await page.click('#more-toggle');await page.getByRole('button',{name:'Help',exact:true}).click();
  await expect(page.locator('#src')).toBeHidden();await page.getByRole('tab',{name:'Text',exact:true}).click();await expect(page.locator('#src')).toBeVisible();
  await page.getByRole('tab',{name:'Split',exact:true}).click();
  await page.click('#more-toggle'); const close=page.locator('#fk-more-drawer .fk-close');
  const box=await close.boundingBox(); expect(box.y+box.height).toBeLessThanOrEqual(800);
  const pairs=await page.locator('#fk-more-drawer button:visible').evaluateAll(nodes=>nodes.filter(node=>!node.disabled).map(node=>({color:getComputedStyle(node).color,background:getComputedStyle(node).backgroundColor})));
  const luminance=css=>{const rgb=css.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];};
  for(const pair of pairs){const a=luminance(pair.color),b=luminance(pair.background);expect((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toBeGreaterThanOrEqual(4.5);}
  await close.click(); await expect(page.locator('#more-toggle')).toBeFocused();
});

test('phone link failures remain visible outside More',async({page})=>{
 await page.setViewportSize({width:360,height:640});await page.goto('./#v1.invalid!');
 await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 await expect(page.locator('.fk-status-summary')).toBeVisible();await expect(page.locator('.fk-status-summary')).toContainText('Load failed');
 await expect(page.locator('#fk-more-drawer')).toBeHidden();
});

test('a bare manual link offers rendering on demand',async({page})=>{
 await page.goto('./?run=0');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 await expect(page.locator('[data-node-id]')).toHaveCount(0);await page.click('#more-toggle');
 await page.getByRole('button',{name:'Render once',exact:true}).click();await expect(page.locator('[data-node-id]').first()).toBeVisible();
 expect((await page.evaluate(()=>ModlApp.getSnapshot())).autorun).toBe(false);
});
