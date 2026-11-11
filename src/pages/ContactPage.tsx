import React from "react";
import {
  IconArrowUpRight,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandYoutube,
  IconBrandWhatsapp,
  IconMail,
  IconMapPin,
  IconPhone,
} from "../components/FontAwesomeIcons";
import PageHeading from "../components/PageHeading";
import contactPageHero from "../assets/contact-page-banner.png";

const locationQuery =
  "Tiraha, Mau Rd, beside HP Petrol Pump, Narauli, Azamgarh, Uttar Pradesh 276128";
const phoneNumber = "+91 97217 99777";
const phoneHref = "tel:+919721799777";
const emailAddress = "gauravsales2009@gmail.com";
const whatsappHref = "https://wa.me/919721799777";
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationQuery)}`;
const embeddedMapUrl = `https://www.google.com/maps?q=${encodeURIComponent(locationQuery)}&output=embed`;

export default function ContactPage() {
  return (
    <section className="gs-page gs-container">
      <PageHeading
        eyebrow="CONTACT OUR TEAM"
        title={
          <>
            Let's talk about <em>your power needs.</em>
          </>
        }
        description="Call, email, or visit Gaurav Sales in Narauli, Azamgarh."
        fullImage={contactPageHero}
        imageAlt="Contact Gaurav Sales for inverter, battery, and order support"
      />
      <div className="gs-contact-layout gs-contact-directory">
        <aside className="gs-contact-aside gs-contact-details">
          <span className="gs-eyebrow">GET IN TOUCH</span>
          <h2>We're here to help.</h2>
          <p>Reach out for product advice, availability, or order support.</p>
          <div className="gs-contact-option">
            <span className="gs-contact-icon gs-contact-icon-location">
              <IconMapPin />
            </span>
            <span>
              <strong>Address</strong>
              <a href={mapsUrl} target="_blank" rel="noreferrer">
                Tiraha, Mau Rd, beside HP Petrol Pump, Narauli, Azamgarh, Uttar
                Pradesh 276128 <IconArrowUpRight size={15} />
              </a>
            </span>
          </div>
          <div className="gs-contact-option">
            <span className="gs-contact-icon gs-contact-icon-phone">
              <IconPhone />
            </span>
            <span>
              <strong>Phone</strong>
              <a href={phoneHref}>{phoneNumber}</a>
            </span>
          </div>
          <div className="gs-contact-option">
            <span className="gs-contact-icon gs-contact-icon-email">
              <IconMail />
            </span>
            <span>
              <strong>Email</strong>
              <a href={`mailto:${emailAddress}`}>
                {emailAddress}
              </a>
            </span>
          </div>
          <div className="gs-contact-option">
            <span className="gs-contact-icon gs-contact-icon-whatsapp">
              <IconBrandWhatsapp />
            </span>
            <span>
              <strong>WhatsApp</strong>
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                {phoneNumber}
              </a>
            </span>
          </div>
          <div className="gs-contact-social" aria-label="Follow Gaurav Sales">
            <strong>Connect with us</strong>
            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="Visit Facebook"
              title="Facebook"
              className="social-facebook"
            >
              <IconBrandFacebook />
            </a>
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="Visit Instagram"
              title="Instagram"
              className="social-instagram"
            >
              <IconBrandInstagram />
            </a>
            <a
              href="https://www.youtube.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="Visit YouTube"
              title="YouTube"
              className="social-youtube"
            >
              <IconBrandYoutube />
            </a>
          </div>
        </aside>
        <div className="gs-map-card">
          <div className="gs-map-heading">
            <span>
              <strong>Visit us</strong>
              <small>Tiraha, Mau Rd, Narauli</small>
            </span>
            <a href={mapsUrl} target="_blank" rel="noreferrer">
              Open map <IconArrowUpRight size={15} />
            </a>
          </div>
          <iframe
            className="gs-map-frame"
            title="Google Map showing Gaurav Sales, Tiraha Narauli"
            src={embeddedMapUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}
