import { LEGAL } from '../config.js';

/*
 * The legal pages' text. Operator name, contact email and governing law come
 * from LEGAL in config.js (set through VITE_LEGAL_* variables), so they can
 * change without touching this file.
 */

const linkClass = 'font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-600 dark:text-emerald-400';

function A({ href, children }) {
  const external = href.startsWith('http');
  return (
    <a href={href} className={linkClass} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children}
    </a>
  );
}

function H({ children }) {
  return <h2 className="mt-8 text-base font-semibold text-slate-900 dark:text-slate-100">{children}</h2>;
}

function P({ children }) {
  return <p className="mt-3">{children}</p>;
}

function UL({ children }) {
  return <ul className="mt-3 list-disc space-y-1.5 pl-5">{children}</ul>;
}

function Contact() {
  return LEGAL.contactEmail ? (
    <A href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</A>
  ) : (
    <A href={LEGAL.contactUrl}>{LEGAL.contactUrl.replace('https://', '')}</A>
  );
}

const op = LEGAL.operator;
const APP = `${op} TimeKeeping`;
const LAW = LEGAL.governingLaw || `the country in which ${op} is established`;

function Terms() {
  return (
    <>
      <P>
        These Terms of Use (“Terms”) govern your use of {APP} (the “App”), a free, browser-based time-tracking tool operated by {op} (“we”,
        “us”). By opening or using the App you agree to these Terms. If you do not agree, do not use the App.
      </P>

      <H>1. The service</H>
      <P>
        The App lets you plan tasks, run timers, and review where your time went. It is provided free of charge. We may add, change, or remove
        features, show advertising, or stop offering the App at any time, with or without notice.
      </P>

      <H>2. No account, your data stays on your device</H>
      <P>
        The App has no user accounts and no server-side database. Everything you enter (tasks, templates, clients, time logs, comments, and
        settings) is saved only in your own browser's local storage on your own device. We cannot see, recover, or restore it.
      </P>
      <UL>
        <li>Clearing your browser data, using a private window, switching browser or device, or a browser update can delete or hide your data.</li>
        <li>You are responsible for backing up anything you need, for example with the App's JSON/CSV export.</li>
        <li>You are responsible for the content you enter, and for having the right to store it, including information about your clients.</li>
      </UL>

      <H>3. Acceptable use</H>
      <P>You agree not to:</P>
      <UL>
        <li>use the App for anything unlawful, or to infringe anyone else's rights;</li>
        <li>attempt to disrupt, overload, probe, or gain unauthorized access to the App or the systems that host it;</li>
        <li>click on, or cause others to click on, advertisements in the App artificially or fraudulently, or interfere with how ads are shown;</li>
        <li>copy, resell, or redistribute the App as your own service, or remove any notices from it, except as an applicable software license allows.</li>
      </UL>

      <H>4. Third-party services</H>
      <P>
        The App is hosted by a third-party provider and may show advertisements served by third parties such as Google AdSense. If the optional
        AI comment feature is enabled and you add your own API key, your comment text is sent to that AI provider under your own account. Your use
        of those services is also governed by their own terms and privacy policies. We are not responsible for third-party services, ads, or the
        websites they link to. See our <A href="#/legal/privacy">Privacy Policy</A> and{' '}
        <A href="#/legal/cookies">Cookie &amp; Advertising Policy</A>.
      </P>

      <H>5. Intellectual property</H>
      <P>
        The App, its design, and the {op} name and logo belong to {op} or its licensors. Where the App's source code is published under a
        software license, that license governs your use of the code. These Terms do not give you any right to use the {op} name or branding.
        You keep all rights to the content you enter.
      </P>

      <H>6. Feedback</H>
      <P>If you send us ideas or suggestions, we may use them freely, without any obligation to you.</P>

      <H>7. No warranty</H>
      <P>
        The App is provided <strong>“as is” and “as available”</strong>, without warranties of any kind, express or implied, including
        merchantability, fitness for a particular purpose, accuracy, and non-infringement. We do not promise the App will be uninterrupted,
        error-free, or that data will not be lost. Time records and totals are provided for your convenience; see our{' '}
        <A href="#/legal/disclaimer">Disclaimer</A>.
      </P>

      <H>8. Limitation of liability</H>
      <P>
        To the fullest extent the law allows, {op} will not be liable for any indirect, incidental, special, consequential, or punitive damages,
        or for any loss of data, profits, revenue, or business, arising from your use of or inability to use the App. Because the App is free, our
        total liability for any claim relating to the App is limited to zero, or to the lowest amount the applicable law permits. Nothing in these
        Terms limits liability that cannot be limited by law, or your rights as a consumer under mandatory law.
      </P>

      <H>9. Indemnity</H>
      <P>
        You agree to defend and hold {op} harmless from claims arising out of your misuse of the App or your breach of these Terms, to the extent
        permitted by law.
      </P>

      <H>10. Ending use</H>
      <P>
        You can stop using the App at any time. We may restrict access to the App for anyone who breaches these Terms. Sections 5 to 12 survive
        after you stop using the App.
      </P>

      <H>11. Changes to these Terms</H>
      <P>
        We may update these Terms. The date at the top shows the latest version. Continuing to use the App after an update means you accept the
        new Terms.
      </P>

      <H>12. Governing law</H>
      <P>
        These Terms are governed by the laws of {LAW}, without regard to conflict-of-law rules. If you are a consumer, you also keep the protection
        of the mandatory laws of the country where you live. If any part of these Terms is found unenforceable, the rest stays in effect.
      </P>

      <H>13. Contact</H>
      <P>
        Questions about these Terms: <Contact />.
      </P>
    </>
  );
}

function Privacy() {
  return (
    <>
      <P>
        This Privacy Policy explains what information {APP} (the “App”), operated by {op} (“we”, “us”), handles, and the choices you have. The
        short version: <strong>we do not run accounts or a database, and your work data never leaves your device</strong> unless you choose to
        use an optional feature described below.
      </P>

      <H>1. Data stored on your device</H>
      <P>
        Tasks, templates, clients, time logs, comments, and settings you enter are saved in your browser's local storage on your device. They are
        not sent to us. You can view, export, or delete them at any time: use the App's export to download a copy, and clear this site's data in
        your browser settings to erase everything. The App also stores your light/dark theme and your cookie choice the same way.
      </P>

      <H>2. Hosting and technical data</H>
      <P>
        The App is delivered by a hosting provider (currently <A href="https://vercel.com/legal/privacy-policy">Vercel</A>). Like any website,
        when your browser downloads the App, the provider automatically processes technical data such as your IP address, browser type, the page
        requested, and the time of the request, to deliver the site, keep it secure, and prevent abuse. We do not use this data to identify you.
      </P>

      <H>3. Advertising</H>
      <P>
        To keep the App free, we may show ads served by Google AdSense and its partners. Ad scripts can use cookies and similar technologies to
        show ads, limit how often you see them, measure performance, prevent fraud, and, if you allow it, personalize ads based on your
        interests. Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this and other websites.
        Google's use of advertising cookies enables it and its partners to serve ads to you based on your visits to this site and/or other sites
        on the Internet.
      </P>
      <UL>
        <li>
          Ad scripts are only loaded after you accept them in our cookie banner, or, where Google's consent message is used, according to the
          choice you make there.
        </li>
        <li>
          You can change your choice at any time with <strong>Privacy choices</strong> in the footer.
        </li>
        <li>
          You can opt out of personalized advertising in <A href="https://adssettings.google.com">Google Ad Settings</A> or at{' '}
          <A href="https://www.aboutads.info/choices/">aboutads.info</A>. Learn{' '}
          <A href="https://policies.google.com/technologies/partner-sites">how Google uses information from sites that use its services</A>.
        </li>
      </UL>
      <P>
        Ad content in the App cannot read your tasks or time logs: your work data is never shared with advertisers. See the{' '}
        <A href="#/legal/cookies">Cookie &amp; Advertising Policy</A> for details.
      </P>

      <H>4. Optional AI comment feature</H>
      <P>
        If the “Improve with AI” feature is enabled and you add your own Anthropic API key, the comment you choose to improve, together with the
        task, subtask, and client names, is sent directly from your browser to Anthropic under your own account. We do not receive it. Anthropic
        handles it under its <A href="https://www.anthropic.com/legal/privacy">privacy policy</A>. Your API key is stored only in your browser.
      </P>

      <H>5. Notifications</H>
      <P>
        If you turn on desktop notifications, your browser asks for permission and shows alerts locally. No notification data is sent to us.
      </P>

      <H>6. Legal bases (EEA, UK, Switzerland)</H>
      <UL>
        <li>Advertising cookies and personalized ads: your consent, which you can withdraw at any time.</li>
        <li>Hosting and security logs: our legitimate interest in delivering a secure, working service.</li>
        <li>Data you enter in the App: stays on your device and is processed by your own browser at your request.</li>
      </UL>

      <H>7. Your rights</H>
      <P>
        Depending on where you live (for example under the GDPR, UK GDPR, or US state privacy laws such as the CCPA/CPRA), you may have the right
        to access, correct, delete, or port personal data, to object to or restrict processing, to withdraw consent, and to complain to a data
        protection authority. Because we do not hold your work data, most of these rights are exercised directly in your browser. For data held
        by Google or our host, you can also contact them directly. To ask us anything, write to <Contact />.
      </P>

      <H>8. US state privacy notice</H>
      <P>
        We do not sell personal information for money. Advertising cookies may count as “sharing” for cross-context behavioral advertising under
        some US state laws. You can opt out by choosing <strong>Essential only</strong> under Privacy choices. We treat a{' '}
        <A href="https://globalprivacycontrol.org/">Global Privacy Control</A> signal from your browser as an opt-out.
      </P>

      <H>9. Children</H>
      <P>
        The App is a work tool and is not directed to children under 13 (or under 16 in the EEA). We do not knowingly collect information from
        children.
      </P>

      <H>10. International transfers and retention</H>
      <P>
        Our host and advertising partners may process technical data in the United States and other countries, using safeguards such as standard
        contractual clauses. Hosting logs and advertising data are kept by those providers for the periods set out in their own policies. Data in
        your browser is kept until you delete it.
      </P>

      <H>11. Changes</H>
      <P>We may update this policy. The date at the top shows the latest version. Significant changes may also ask for your consent again.</P>

      <H>12. Contact</H>
      <P>
        Privacy questions or requests: <Contact />.
      </P>
    </>
  );
}

const STORAGE_ROWS = [
  ['balisoft-timekeeping:v1', 'Local storage', 'Your tasks, templates, clients, time logs, and settings', 'Essential', 'Until you delete it'],
  ['balisoft-theme', 'Local storage', 'Remembers light or dark mode', 'Essential', 'Until you delete it'],
  ['balisoft-timekeeping:consent', 'Local storage', 'Remembers your cookie and ads choice', 'Essential', 'Until you delete it'],
  ['balisoft-timekeeping:ai', 'Local storage', 'Your AI model choice and API key (only if you use the AI feature)', 'Functional', 'Until you delete it'],
  [
    'Google AdSense cookies (e.g. __gads, __gpi, __eoi, IDE)',
    'Third-party cookies',
    'Show and measure ads, cap frequency, prevent fraud, personalize ads if allowed',
    'Advertising (consent)',
    'Up to 13 months, set by Google',
  ],
];

function Cookies() {
  return (
    <>
      <P>
        This policy explains the cookies and similar technologies (such as local storage) used by {APP} (the “App”), and how ads work in the App.
        It supplements our <A href="#/legal/privacy">Privacy Policy</A>.
      </P>

      <H>1. What we store</H>
      <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full min-w-[36rem] text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            <tr>
              {['Name', 'Type', 'Purpose', 'Category', 'Duration'].map((h) => (
                <th key={h} className="px-3 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {STORAGE_ROWS.map((row) => (
              <tr key={row[0]}>
                {row.map((cell, i) => (
                  <td key={i} className={`px-3 py-2 align-top ${i === 0 ? 'font-mono' : ''}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <P>
        Essential storage is needed for the App to work and does not require consent. The App itself sets no analytics or tracking cookies.
      </P>

      <H>2. Advertising</H>
      <P>
        The App is free and may be supported by ads from Google AdSense. Ads are clearly labeled “Advertisement” and are kept apart from the App's
        controls. We do not choose individual ads and do not endorse the products or services advertised.
      </P>
      <UL>
        <li>
          <strong>Accept</strong>: ad scripts load and may use cookies, including for personalized ads.
        </li>
        <li>
          <strong>Essential only</strong>: no ad scripts or ad cookies are loaded by our banner.
        </li>
        <li>
          Visitors in the EEA, UK, and Switzerland may instead see Google's own consent message, which lets you choose by purpose and by vendor.
        </li>
      </UL>
      <P>
        You can change your choice at any time with <strong>Privacy choices</strong> in the footer. Turning ads off reloads the page so ad
        scripts are removed. Cookies already set by Google can be deleted in your browser settings.
      </P>

      <H>3. Managing cookies in your browser</H>
      <P>
        Most browsers let you block or delete cookies and site data. Deleting this site's data also deletes your tasks and time logs, so export
        them first. You can also opt out of personalized ads at <A href="https://adssettings.google.com">Google Ad Settings</A>.
      </P>

      <H>4. Contact</H>
      <P>
        Questions about cookies or ads: <Contact />.
      </P>
    </>
  );
}

function Disclaimer() {
  return (
    <>
      <P>
        {APP} (the “App”) is a personal productivity tool provided free of charge by {op}. Please read this disclaimer before relying on it.
      </P>

      <H>Time records</H>
      <P>
        Timers, totals, calendar blocks, estimates, and exports are provided for convenience and planning. They depend on your device's clock and
        browser, and can be affected by browser settings, cleared data, or software errors. The App is not a certified payroll, billing, or
        legal timekeeping system. Check your records before using them for invoices, timesheets, payroll, or any decision with financial or legal
        consequences.
      </P>

      <H>No professional advice</H>
      <P>Nothing in the App is legal, financial, tax, or employment advice.</P>

      <H>Data loss</H>
      <P>
        All data lives in your browser. {op} has no copy and cannot recover lost data. Export regularly if your records matter.
      </P>

      <H>AI-generated text</H>
      <P>
        If you use the optional AI comment feature, the suggested text is generated automatically and may be inaccurate. Review it before you
        rely on or share it.
      </P>

      <H>Advertisements and external links</H>
      <P>
        Ads are provided by third parties. {op} does not control or endorse advertisers or the websites that ads and other external links lead
        to, and is not responsible for their content, products, or practices.
      </P>

      <H>Trademarks</H>
      <P>Product and company names mentioned in the App may be trademarks of their respective owners and are used for identification only.</P>

      <H>Contact</H>
      <P>
        Questions: <Contact />.
      </P>
    </>
  );
}

export const LEGAL_DOCS = [
  { id: 'terms', title: 'Terms of Use', short: 'Terms', Body: Terms },
  { id: 'privacy', title: 'Privacy Policy', short: 'Privacy', Body: Privacy },
  { id: 'cookies', title: 'Cookie & Advertising Policy', short: 'Cookies & Ads', Body: Cookies },
  { id: 'disclaimer', title: 'Disclaimer', short: 'Disclaimer', Body: Disclaimer },
];
