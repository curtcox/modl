import {test,expect} from '@playwright/test';
test('native groups, ports, marks and persistent raw text view',async({page})=>{
 const src='g Commands {\na square echo "hello world"\nb cylinder output\na[err] -> b[3] double "long edge label that exceeds the preview"\n}\n#gl mapping=typed';
 const url='./#h1='+Buffer.from(JSON.stringify({src,pos:{}})).toString('base64url')+'&mark=a,L4';
 await page.goto(url);await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 await expect(page.locator('[data-group-id="g"] rect')).toBeVisible();
 await expect(page.locator('[data-edge-line="4"]')).toContainText('err');
 await expect(page.locator('#pragma-preview mark')).toHaveText('#gl mapping=typed');
 await expect(page.locator('[data-node-id="a"]')).toHaveCSS('filter',/drop-shadow/);
 await page.click('#more-toggle');await page.locator('#show-raw-text').check();
 await expect(page.locator('[data-node-id="a"]')).toContainText('echo "hello world"');
 await page.reload();await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 expect((await page.evaluate(()=>ModlApp.getSnapshot())).rawText).toBe(true);
 await expect(page.locator('[data-node-id="a"]')).toContainText('echo "hello world"');
});
