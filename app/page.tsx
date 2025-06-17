import CompanionCard from '@/components/CompanionCard'
import CompanionsList from '@/components/CompanionsList'
import Cta from '@/components/CTA'
import { getAllCompanions, getBookmarkedCompanions, getRecentSessions } from '@/lib/actions/companion.actions'
import { getSubjectColor } from '@/lib/utils'
import { auth } from '@clerk/nextjs/server'
import React from 'react'

const Page = async () => {
  const companions = await getAllCompanions({ limit: 3 });
  const recentSessionsCompanions = await getRecentSessions(10);

  console.log('companions: ',companions)

  const { userId } = await auth()

  const bookmarkedCompanions = await getBookmarkedCompanions(userId!)
  // console.log('bookmarkedCompanions: ', bookmarkedCompanions)
  const bookmarkedIds = bookmarkedCompanions
    .map((bookmark) => bookmark?.id)
    .filter(Boolean);



  // console.log('bookmarkedIds: ',bookmarkedIds)




  return (
    <main>
      <h1 className="text-2xl font-bold">Popular Companions</h1>
      <section className="home-section">
        {companions.map((companion) => (
          <CompanionCard
            key={companion.id}
            {...companion}
            color={getSubjectColor(companion.subject)}
            bookmarked={bookmarkedIds.includes(companion.id)}
           
          />
        ))}
      </section>
      <section className="home-section">
        <CompanionsList
          title="Recently completed sessions"
          companions={recentSessionsCompanions}
          classNames='w-2/3 max-lg:w-full'
        />
        <Cta />
      </section>
    </main>
  )
}

export default Page