import fs from 'fs';
import Handlebars from 'handlebars';
import puppeteer from 'puppeteer';
import { URL } from 'url';

/**
 * Helper function to format year from date
 */
Handlebars.registerHelper('formatYear', function (date) {
    if (!date) return '';
    return new Date(date).getFullYear();
});

/**
 * Generate PDF resume from an html template.
 * @param {string} data - data to be populated in the pdf template
 * @param {string} template_path - Path of the html template (with extension)
 * @returns {Promise<Buffer>} - PDF file as buffer
 */
async function generatePDF(template_path: string | number | Buffer<ArrayBufferLike> | URL, data: any) {
    try {
        //Checking data and template existing
        if (data) {
            // @ts-ignore
            if (fs.existsSync(template_path)) {
                //Load and compile template
                const templateSource = fs.readFileSync(template_path, 'utf8');
                const template = Handlebars.compile(templateSource);
                //Apply data to template
                const html = template(data);
                //Generate PDF using Puppeteer
                let browser;
                try {
                    browser = await puppeteer.launch({
                        headless: true,
                        args: ['--no-sandbox', '--disable-setuid-sandbox']
                    });
                    const page = await browser.newPage();
                    //Set content and wait for resources to load
                    await page.setContent(html, { waitUntil: 'networkidle0' });
                    //Generate PDF
                    const pdf = await page.pdf({
                        format: 'A4',
                        printBackground: true,
                        margin: {
                            top: '20px',
                            right: '20px',
                            bottom: '20px',
                            left: '20px'
                        }
                    });
                    const pdfFile = {
                        buffer: pdf,
                        mimetype: 'application/pdf',
                        originalname: 'document.pdf',
                        fieldname: 'pdf',
                        size: pdf.length
                    };
                    return pdfFile;
                }
                catch (error) {
                    // @ts-ignore
                    throw new Error('Error generating resume PDF:', error);
                }
                finally {
                    // @ts-ignore
                    browser.close();
                }
            }
            else {
                throw new Error('Template not found');
            }
        }
        else {
            throw new Error('Data is required');
        }
    } catch (error) {
        console.error('Error generating resume PDF:', error);
        throw error;
    }
}

module.exports = {
    generatePDF
};