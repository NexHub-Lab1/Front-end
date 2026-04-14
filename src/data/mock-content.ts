import type { BountyCard, DeveloperCard, ProjectCard } from '../types/app'

export const topProjects: ProjectCard[] = [
  {
    id: 1,
    name: 'DevConnector',
    description: 'Social network for developers',
    tags: ['Node.js', 'MERN'],
    stars: 22,
    followers: 14,
  },
  {
    id: 2,
    name: 'Web3 Dashboard',
    description: 'Crypto and DeFi management tool',
    tags: ['Solidity', 'Ethereum'],
    stars: 18,
    followers: 9,
  },
  {
    id: 3,
    name: 'AI Code Assistant',
    description: 'AI-powered coding assistant',
    tags: ['Python', 'OpenAI'],
    stars: 17,
    followers: 10,
  },
]

export const topBounties: BountyCard[] = [
  {
    title: 'Improve UI animations in DevConnector',
    project: 'DevConnector',
    reward: '$500',
    meta: '14 followers',
  },
  {
    title: 'Implement OAuth2 login in DevFlow',
    project: 'DevFlow',
    reward: '$200',
    meta: '2 followers',
  },
  {
    title: 'Add ENS support to Solidity Contracts Hub',
    project: 'Review',
    reward: '$400',
    meta: '1 day ago',
  },
]

export const topDevelopers: DeveloperCard[] = [
  {
    name: 'Aaron Molina',
    handle: '@aaron-m',
    followers: 345,
    score: '4.99',
    rank: '#1',
  },
  {
    name: 'Camille Dubois',
    handle: '@camille-d',
    followers: 310,
    score: '4.98',
    rank: '#2',
  },
  {
    name: 'Manuel Garcia',
    handle: '@manuel-g',
    followers: 292,
    score: '4.97',
    rank: '#3',
  },
]

export const activityItems = [
  'Bounty "API rate limiting solution" by @sarah_code',
  'New contributors joined DevFlow this week',
  'Open React task posted for ManuAI',
]
