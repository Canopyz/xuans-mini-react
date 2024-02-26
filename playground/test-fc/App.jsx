import { useState, useTransition } from '../../packages/react/src'
import TabButton from './TabButton.jsx'
import AboutTab from './AboutTab.jsx'
import PostsTab from './PostsTab.jsx'
import ContactTab from './ContactTab.jsx'

export default function TabContainer() {
  const [isPending, startTransition] = useTransition()
  const [tab, setTab] = useState('about')

  function selectTab(nextTab) {
    startTransition(() => {
      setTab(nextTab)
    })
  }

  return (
    <div>
      <TabButton
        isActive={tab === 'about'}
        onClick={() => selectTab('about')}
      >
        About
      </TabButton>
      <TabButton
        isActive={tab === 'posts'}
        onClick={() => selectTab('posts')}
      >
        Posts (slow)
      </TabButton>
      <TabButton
        isActive={tab === 'contact'}
        onClick={() => selectTab('contact')}
      >
        Contact
      </TabButton>
      {tab === 'about' && <AboutTab />}
      {tab === 'posts' && <PostsTab />}
      {tab === 'contact' && <ContactTab />}
    </div>
  )
}
