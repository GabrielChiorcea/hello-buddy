/**
 * Terms and Conditions page
 */

import React from 'react';
import { Layout } from '@/components/layout/Layout';

const Terms: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Termeni și Condiții</h1>
        
        <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Informații generale</h2>
            <p>
              Prezentele Termeni și Condiții reglementează utilizarea platformei FoodOrder 
              și relația dintre operator și utilizatori. Prin crearea unui cont și utilizarea 
              serviciilor noastre, confirmați că ați citit, înțeles și acceptat acești termeni.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Protecția datelor personale (GDPR)</h2>
            <p>
              În conformitate cu Regulamentul (UE) 2016/679 (GDPR), colectăm și prelucrăm 
              datele dumneavoastră personale doar în scopul furnizării serviciilor noastre:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Nume, email, telefon — pentru gestionarea contului și comunicarea privind comenzile</li>
              <li>Adresa de livrare — pentru livrarea comenzilor</li>
              <li>Istoricul comenzilor — pentru îmbunătățirea serviciilor</li>
            </ul>
            <p>
              Aveți dreptul de acces, rectificare, ștergere și portabilitate a datelor. 
              Puteți solicita ștergerea contului din secțiunea Profil → Setări cont.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Comenzi și plăți</h2>
            <p>
              Prin plasarea unei comenzi, vă obligați să achitați contravaloarea produselor 
              și a taxei de livrare, dacă este cazul. Prețurile sunt afișate în RON și includ TVA.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Livrare</h2>
            <p>
              Timpii de livrare sunt estimativi și pot varia în funcție de volumul comenzilor 
              și condițiile externe. Ne rezervăm dreptul de a anula comenzi în situații excepționale.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Programul de loialitate</h2>
            <p>
              Punctele de loialitate sunt acordate la fiecare comandă livrată cu succes. 
              Acestea pot fi folosite pentru reduceri la comenzile viitoare conform pragurilor 
              stabilite. Ne rezervăm dreptul de a modifica regulile programului.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Anulări și returnări</h2>
            <p>
              Comenzile pot fi anulate înainte de confirmarea de către restaurant. 
              Punctele utilizate la o comandă anulată vor fi returnate automat în contul dumneavoastră.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Contact</h2>
            <p>
              Pentru orice nelămuriri privind acești termeni sau protecția datelor, 
              ne puteți contacta la: contact@foodorder.ro sau 0800 123 456.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default Terms;
