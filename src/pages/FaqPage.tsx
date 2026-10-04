import React from "react";
import { Accordion, Button } from "@mantine/core";
import { IconArrowRight, IconBolt } from "@tabler/icons-react";
import PageHeading from "../components/PageHeading";
import type { RoutePath } from "../Route/AppRoutes";
import inverterBanner from "../assets/inverter-hero-backup.svg";

const questions = [
  ["How do I choose the right inverter size?", "Start with the appliances you need to run and their combined power demand. If you’re unsure, contact us with your appliance list and we can help you compare capacities."],
  ["Can I add a battery to my inverter?", "Battery compatibility depends on the inverter model and battery specifications. Check the product details and confirm compatibility with our team before ordering."],
  ["How does cash on delivery work?", "Choose cash on delivery at checkout. Payment is due when your order is delivered. Availability and any order limits should be confirmed with our team before dispatch."],
  ["How long does shipping take?", "Dispatch and transit times depend on the destination and stock availability. We’ll share shipping details and updates after your order is confirmed."],
  ["What happens if I need help after my purchase?", "Contact our team with your order details and product model. We can help direct you to the relevant setup, warranty, or support information."],
];

type FaqPageProps = { navigate: (path: RoutePath) => void };

export default function FaqPage({ navigate }: FaqPageProps) {
  return (
    <section className="gs-page gs-container">
      <PageHeading
        eyebrow="HELP CENTER"
        title={<>Good questions. <em>Clear answers.</em></>}
        description="A few helpful details on choosing, ordering, delivery, and paying for your inverter."
        image={inverterBanner}
      />
      <div className="gs-faq-layout">
        <aside className="gs-faq-aside"><span><IconBolt size={25} /></span><h2>Need a little more help?</h2><p>Our team can help you understand your options before you order.</p><Button className="gs-button" onClick={() => navigate("/contact")}>Contact us <IconArrowRight size={16} /></Button></aside>
        <Accordion className="gs-accordion" variant="separated">
          {questions.map(([question, answer]) => (
            <Accordion.Item value={question} key={question}>
              <Accordion.Control>{question}</Accordion.Control>
              <Accordion.Panel>{answer}</Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
