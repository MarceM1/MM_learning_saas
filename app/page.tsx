import CompanionCard from '@/components/CompanionCard'
import CompanionsList from '@/components/CompanionsList'
import Cta from '@/components/CTA'
import { recentSessions } from '@/constants'
import React from 'react'

const Page = () => {
  return (
    <main>
      <h1 className="text-2xl font-bold">Popular Companions</h1>
      <section className="home-section">
        <CompanionCard 
          id='123'
          name='Neura the Brain Explorer'
          topic='Neural Network of the Brain'
          subject='science'
          duration={45}
          color='#ffda6e'
        />
        <CompanionCard 
          id='456'
          name='Countsy the Number Wizard'
          topic='Derivatives & Integrals'
          subject='Maths'
          duration={30}
          color='#e5d0ff'
        />
        <CompanionCard 
          id='798'
          name='Verbal the Vocabulary Builder'
          topic='English Literature'
          subject='Language'
          duration={30}
          color='#8de7ff'
        />
      </section>
      <section className="home-section">
        <CompanionsList 
          title="Recently completed sessions"
          companions = {recentSessions}
          classNames = 'w-2/3 max-lg:w-full'
        />
        <Cta />
      </section>
    </main>
  )
}

export default Page