import React from "react";
import { IconArrowUpRight, IconMail, IconMapPin, IconPhone } from "@tabler/icons-react";
import PageHeading from "../components/PageHeading";

const locationQuery = "Naurauli, Azamgarh";
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationQuery)}`;
const embeddedMapUrl = `https://www.google.com/maps?q=${encodeURIComponent(locationQuery)}&output=embed`;

export default function ContactPage() {
  return (
    <section className="gs-page gs-container">
      <PageHeading
        eyebrow="CONTACT OUR TEAM"
        title={<>Let's talk about <em>your power needs.</em></>}
        description="Call, email, or find Gaurav Sales in Naurauli, Azamgarh."
      />
      <div className="gs-contact-layout gs-contact-directory">
        <aside className="gs-contact-aside gs-contact-details">
          <span className="gs-eyebrow">GET IN TOUCH</span>
          <h2>We're here to help.</h2>
          <p>Reach out for product advice, availability, or order support.</p>
          <div className="gs-contact-option">
            <IconMapPin />
            <span>
              <strong>Address</strong>
              <a href={mapsUrl} target="_blank" rel="noreferrer">
                Naurauli, Azamgarh <IconArrowUpRight size={15} />
              </a>
            </span>
          </div>
          <div className="gs-contact-option">
            <IconPhone />
            <span>
              <strong>Phone</strong>
              <a href="tel:674238472384">674238472384</a>
            </span>
          </div>
          <div className="gs-contact-option">
            <IconMail />
            <span>
              <strong>Email</strong>
              <a href="mailto:gaurav@gmail.com">gaurav@gmail.com</a>
            </span>
          </div>
        </aside>
        <div className="gs-map-card">
          <div className="gs-map-heading">
            <span><strong>Visit us</strong><small>Naurauli, Azamgarh</small></span>
            <a href={mapsUrl} target="_blank" rel="noreferrer">
              Open map <IconArrowUpRight size={15} />
            </a>
          </div>
          <iframe
            className="gs-map-frame"
            title="Google Map showing Naurauli, Azamgarh"
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
