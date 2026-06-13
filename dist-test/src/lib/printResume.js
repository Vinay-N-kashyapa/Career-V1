"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateResumeHtml = generateResumeHtml;
exports.printResumeClientSide = printResumeClientSide;
/**
 * Formats a description text block into clean HTML, converting lines or bulleted lists.
 */
function formatDescription(desc) {
    if (!desc)
        return '';
    const lines = desc.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0)
        return '';
    const hasBullets = lines.some(line => line.startsWith('-') || line.startsWith('*') || line.startsWith('•'));
    if (hasBullets || lines.length > 1) {
        const listItems = lines.map(line => {
            const cleaned = line.replace(/^[-*•]\s*/, '');
            return `<li>${cleaned}</li>`;
        }).join('');
        return `<ul class="bullet-list">${listItems}</ul>`;
    }
    return `<p>${desc}</p>`;
}
/**
 * Generates the complete, standalone HTML document for the resume.
 */
function generateResumeHtml(data) {
    const { fullName, email, phone, address, linkedin, portfolio, summary, experiences, education, skills = { technical: '', professional: '', personal: '' }, projects, certificates, languages, declaration } = data;
    // Contact list
    const contactItems = [];
    if (email)
        contactItems.push(`<li>${email}</li>`);
    if (phone)
        contactItems.push(`<li>${phone}</li>`);
    if (address)
        contactItems.push(`<li>${address}</li>`);
    if (linkedin) {
        const display = linkedin.replace(/^(https?:\/\/)?(www\.)?/, '');
        contactItems.push(`<li><a href="${linkedin.startsWith('http') ? linkedin : `https://${linkedin}`}" target="_blank">${display}</a></li>`);
    }
    if (portfolio) {
        const display = portfolio.replace(/^(https?:\/\/)?(www\.)?/, '');
        contactItems.push(`<li><a href="${portfolio.startsWith('http') ? portfolio : `https://${portfolio}`}" target="_blank">${display}</a></li>`);
    }
    // Skills
    const hasSkills = skills.technical || skills.professional || skills.personal;
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Resume - ${fullName || 'Candidate'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 15mm 15mm;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.4;
      margin: 0;
      padding: 0;
      font-size: 10pt;
      background-color: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    a {
      color: #1e293b;
      text-decoration: none;
      border-bottom: 0.5px solid #cbd5e1;
    }
    
    .header {
      text-align: center;
      margin-bottom: 18px;
    }
    
    .name {
      font-size: 20pt;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 4px 0;
      letter-spacing: -0.5px;
    }
    
    .contact-info {
      font-size: 8.5pt;
      color: #475569;
      display: flex;
      justify-content: center;
      gap: 10px;
      flex-wrap: wrap;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    
    .contact-info li:not(:last-child)::after {
      content: "|";
      margin-left: 10px;
      color: #cbd5e1;
    }
    
    .section {
      margin-bottom: 18px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    .section-title {
      font-size: 10.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #0f172a;
      border-bottom: 1.5px solid #cbd5e1;
      padding-bottom: 2px;
      margin-top: 0;
      margin-bottom: 8px;
    }
    
    .summary {
      font-size: 9.5pt;
      color: #334155;
      line-height: 1.5;
      margin: 0;
      text-align: justify;
    }
    
    .item {
      margin-bottom: 10px;
    }
    
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 2px;
    }
    
    .item-title {
      font-size: 10pt;
      font-weight: 700;
      color: #0f172a;
    }
    
    .item-subtitle {
      font-size: 9.5pt;
      font-weight: 600;
      color: #475569;
    }
    
    .item-date {
      font-size: 9pt;
      color: #64748b;
      font-weight: 500;
      white-space: nowrap;
    }
    
    .item-description {
      font-size: 9.5pt;
      color: #334155;
      margin: 2px 0 0 0;
    }

    .item-description p {
      margin: 0;
    }
    
    .bullet-list {
      margin: 2px 0 0 0;
      padding-left: 16px;
    }

    .bullet-list li {
      margin-bottom: 2px;
      color: #334155;
    }
    
    .skills-grid {
      display: table;
      width: 100%;
      font-size: 9.5pt;
    }
    
    .skills-row {
      display: table-row;
    }
    
    .skills-label {
      display: table-cell;
      font-weight: 700;
      color: #0f172a;
      width: 130px;
      padding-bottom: 4px;
      vertical-align: top;
    }
    
    .skills-value {
      display: table-cell;
      color: #334155;
      padding-bottom: 4px;
      vertical-align: top;
    }
    
    .declaration-text {
      font-size: 9pt;
      color: #475569;
      font-style: italic;
      margin-top: 10px;
      line-height: 1.4;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <h1 class="name">${fullName || 'Your Name'}</h1>
    <ul class="contact-info">
      ${contactItems.join('')}
    </ul>
  </div>

  <!-- Summary -->
  ${summary ? `
  <div class="section">
    <div class="section-title">Professional Summary</div>
    <div class="summary">${summary}</div>
  </div>
  ` : ''}

  <!-- Education -->
  ${education && education.length > 0 && education.some(e => e.degree || e.institution) ? `
  <div class="section">
    <div class="section-title">Education</div>
    ${education.map(edu => {
        if (!edu.degree && !edu.institution)
            return '';
        return `
      <div class="item">
        <div class="item-header">
          <div>
            <span class="item-title">${edu.degree || 'Degree'}</span>
            ${edu.institution ? ` | <span class="item-subtitle">${edu.institution}</span>` : ''}
            ${edu.gpa ? `<span style="color: #64748b; font-size: 9pt;"> (GPA: ${edu.gpa})</span>` : ''}
          </div>
          <div class="item-date">${edu.year || ''}</div>
        </div>
        ${edu.description ? `<div class="item-description">${formatDescription(edu.description)}</div>` : ''}
      </div>
      `;
    }).join('')}
  </div>
  ` : ''}

  <!-- Experience -->
  ${experiences && experiences.length > 0 && experiences.some(exp => exp.role || exp.company) ? `
  <div class="section">
    <div class="section-title">Professional Experience</div>
    ${experiences.map(exp => {
        if (!exp.role && !exp.company)
            return '';
        const dateStr = [exp.startDate, exp.currentlyWorking ? 'Present' : exp.endDate].filter(Boolean).join(' - ');
        return `
      <div class="item">
        <div class="item-header">
          <div>
            <span class="item-title">${exp.role || 'Role'}</span>
            ${exp.company ? ` at <span class="item-subtitle">${exp.company}</span>` : ''}
          </div>
          <div class="item-date">${dateStr}</div>
        </div>
        ${exp.description ? `<div class="item-description">${formatDescription(exp.description)}</div>` : ''}
      </div>
      `;
    }).join('')}
  </div>
  ` : ''}

  <!-- Projects -->
  ${projects && projects.length > 0 && projects.some(proj => proj.name) ? `
  <div class="section">
    <div class="section-title">Projects</div>
    ${projects.map(proj => {
        if (!proj.name)
            return '';
        return `
      <div class="item">
        <div class="item-header">
          <div>
            <span class="item-title">${proj.name}</span>
            ${proj.technologies ? `<span style="color: #64748b; font-size: 9pt; font-weight: normal;"> (${proj.technologies})</span>` : ''}
          </div>
          <div class="item-date">
            ${proj.link ? `<a href="${proj.link.startsWith('http') ? proj.link : `https://${proj.link}`}" target="_blank">${proj.link.replace(/^(https?:\/\/)?(www\.)?/, '')}</a>` : ''}
          </div>
        </div>
        ${proj.description ? `<div class="item-description">${formatDescription(proj.description)}</div>` : ''}
      </div>
      `;
    }).join('')}
  </div>
  ` : ''}

  <!-- Skills -->
  ${hasSkills ? `
  <div class="section">
    <div class="section-title">Core Skills</div>
    <div class="skills-grid">
      ${skills.technical ? `
      <div class="skills-row">
        <div class="skills-label">Technical Skills:</div>
        <div class="skills-value">${skills.technical}</div>
      </div>
      ` : ''}
      ${skills.professional ? `
      <div class="skills-row">
        <div class="skills-label">Professional Skills:</div>
        <div class="skills-value">${skills.professional}</div>
      </div>
      ` : ''}
      ${skills.personal ? `
      <div class="skills-row">
        <div class="skills-label">Personal Traits:</div>
        <div class="skills-value">${skills.personal}</div>
      </div>
      ` : ''}
    </div>
  </div>
  ` : ''}

  <!-- Certificates -->
  ${certificates && certificates.length > 0 && certificates.some(cert => cert.name) ? `
  <div class="section">
    <div class="section-title">Certifications</div>
    ${certificates.map(cert => {
        if (!cert.name)
            return '';
        return `
      <div class="item">
        <div class="item-header">
          <div>
            <span class="item-title">${cert.name}</span>
            ${cert.issuer ? ` | <span class="item-subtitle">${cert.issuer}</span>` : ''}
            ${cert.credentialId ? `<span style="color: #64748b; font-size: 9pt;"> (ID: ${cert.credentialId})</span>` : ''}
          </div>
          <div class="item-date">${cert.date || ''}</div>
        </div>
      </div>
      `;
    }).join('')}
  </div>
  ` : ''}

  <!-- Languages -->
  ${languages && languages.length > 0 && languages.some(l => l.language) ? `
  <div class="section">
    <div class="section-title">Languages</div>
    <div style="font-size: 9.5pt; color: #334155;">
      ${languages.map(l => {
        if (!l.language)
            return '';
        return `<strong>${l.language}</strong> (${l.proficiency || 'Intermediate'})`;
    }).filter(Boolean).join(', ')}
    </div>
  </div>
  ` : ''}

  <!-- Declaration -->
  ${declaration ? `
  <div class="section" style="margin-top: 25px;">
    <div class="section-title">Declaration</div>
    <div class="declaration-text">${declaration}</div>
  </div>
  ` : ''}

</body>
</html>`;
}
/**
 * Prints the resume client-side by rendering to a hidden iframe and initiating window.print().
 */
function printResumeClientSide(data) {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
        console.error('Cannot access iframe document');
        return;
    }
    const htmlContent = generateResumeHtml(data);
    doc.write(htmlContent);
    doc.close();
    iframe.contentWindow?.focus();
    // Wait a short duration to ensure styles and fonts render before printing
    setTimeout(() => {
        iframe.contentWindow?.print();
        // Clean up
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 1000);
    }, 300);
}
