# Dashboard Component Refactoring Guide

## ✅ Components Created

All dashboard components have been extracted into separate, reusable React components while maintaining the **exact same UI**:

### 1. **DashboardSidebar** (`components/dashboard/DashboardSidebar.tsx`)
- Navigation menu (Organizations, Generate, History, Settings)
- User profile display
- Sign out button
- Responsive mobile/desktop sidebar
- Logo and branding

### 2. **OrganizationSection** (`components/dashboard/OrganizationSection.tsx`)
- Welcome screen (no organization)
- Join/Create organization cards  
- Organization header with stats
- Join Organization Modal (search NIRF colleges + custom orgs)
- Create Organization Modal
- Leave organization functionality

### 3. **ClubsSection** (`components/dashboard/ClubsSection.tsx`)
- "Your Clubs" card with member clubs
- "Available Clubs" card with joinable clubs
- Club logos and member counts
- Join club functionality

### 4. **EventModals** (`components/dashboard/EventModals.tsx`)
- Club Detail Modal (shows all events for a club)
- Create Event Modal with date picker
- Event selection and navigation
- Leave club functionality

### 5. **CreateClubModal** (`components/dashboard/CreateClubModal.tsx`)
- Club creation form
- Logo URL input
- Auto-join creator to club

### 6. **GenerateCertificatesSection** (`components/dashboard/GenerateCertificatesSection.tsx`)
- 3-step progress indicator
- Step 1: Template Upload
- Step 2: Field Configuration  
- Step 3: Certificate Generation
- Back navigation between steps

### 7. **HistorySection** (`components/dashboard/HistorySection.tsx`)
- Certificate generation history list
- History detail modal
- Stats cards (count, success rate, file size)
- Empty state when no history

### 8. **ProfileSettings** (`components/dashboard/ProfileSettings.tsx`)
- Profile form (name, email, phone, bio, image)
- Profile image preview
- Organization display
- Account actions (change password, delete account)
- Save functionality

## 📦 How to Use These Components

### Step 1: Import Components
```typescript
import {
  DashboardSidebar,
  OrganizationSection,
  ClubsSection,
  EventModals,
  CreateClubModal,
  GenerateCertificatesSection,
  HistorySection,
  ProfileSettings,
} from "@/components/dashboard"
```

### Step 2: Simplified Dashboard Structure

The main `app/dashboard/page.tsx` should now only:
1. Manage global state
2. Handle data fetching
3. Orchestrate components
4. Pass props to components

```typescript
export default function DashboardPage() {
  const { data: session, status } = useSession()
  
  // Global state
  const [currentPage, setCurrentPage] = useState<Page>("organizations")
  const [currentStep, setCurrentStep] = useState<Step>("upload")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  // Organization state
  const [hasOrganization, setHasOrganization] = useState(false)
  const [userOrganization, setUserOrganization] = useState<string | null>(null)
  const [userOrganizationLogo, setUserOrganizationLogo] = useState<string | null>(null)
  
  // ... other state variables
  
  return (
    <div className="min-h-screen w-full bg-white relative text-gray-800 flex">
      {/* Crosshatch background */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{...}} />
      
      {/* Mobile menu button */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="...">
        <Menu className="h-5 w-5" />
      </button>

      {/* Sidebar Component */}
      <DashboardSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        selectedEvent={selectedEvent}
        userImage={session?.user?.image}
        userName={session?.user?.name}
        userEmail={session?.user?.email}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen p-2 md:p-4 w-full md:w-auto relative z-10">
        {/* Top Header */}
        <header className="flex items-center justify-between gap-3 md:gap-4 mb-3 md:mb-4 px-2 md:px-4 py-2 mt-16 md:mt-2">
          {selectedEvent && (
            <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0"></div>
              <div className="text-xs md:text-sm flex-1 min-w-0">
                <span className="text-gray-500 hidden sm:inline">Active Event: </span>
                <span className="font-semibold text-gray-900 truncate">{selectedEvent.eventName}</span>
              </div>
            </div>
          )}
          <Avatar className="..." onClick={() => setCurrentPage("settings")}>
            {/* Avatar content */}
          </Avatar>
        </header>

        {/* Page Content - Use Components */}
        <div className="flex-1 overflow-auto p-4 md:p-8 bg-white rounded-t-3xl shadow-sm">
          {currentPage === "generate" && (
            <GenerateCertificatesSection
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              appState={appState}
              setAppState={setAppState}
              selectedEvent={selectedEvent}
              onAddToHistory={addToHistory}
            />
          )}

          {currentPage === "history" && (
            <HistorySection
              generationHistory={generationHistory}
              showHistoryDetailModal={showHistoryDetailModal}
              setShowHistoryDetailModal={setShowHistoryDetailModal}
              selectedHistoryItem={selectedHistoryItem}
              setSelectedHistoryItem={setSelectedHistoryItem}
            />
          )}

          {currentPage === "organizations" && (
            <OrganizationSection
              hasOrganization={hasOrganization}
              setHasOrganization={setHasOrganization}
              userOrganization={userOrganization}
              setUserOrganization={setUserOrganization}
              userOrganizationLogo={userOrganizationLogo}
              setUserOrganizationLogo={setUserOrganizationLogo}
              userClubs={userClubs}
              setUserClubs={setUserClubs}
              clubEvents={clubEvents}
              showJoinOrgModal={showJoinOrgModal}
              setShowJoinOrgModal={setShowJoinOrgModal}
              showCreateOrgModal={showCreateOrgModal}
              setShowCreateOrgModal={setShowCreateOrgModal}
              colleges={colleges}
              userCreatedOrgs={userCreatedOrgs}
              setUserCreatedOrgs={setUserCreatedOrgs}
              setShowCreateClubModal={setShowCreateClubModal}
              renderClubsSection={() => (
                <ClubsSection
                  userClubs={userClubs}
                  setUserClubs={setUserClubs}
                  availableClubs={availableClubs}
                  setAvailableClubs={setAvailableClubs}
                  clubEvents={clubEvents}
                  setSelectedClub={setSelectedClub}
                  setShowClubDetailModal={setShowClubDetailModal}
                  setShowCreateClubModal={setShowCreateClubModal}
                />
              )}
            />
          )}

          {currentPage === "settings" && (
            <ProfileSettings
              profileName={profileName}
              setProfileName={setProfileName}
              profileEmail={profileEmail}
              setProfileEmail={setProfileEmail}
              profilePhone={profilePhone}
              setProfilePhone={setProfilePhone}
              profileBio={profileBio}
              setProfileBio={setProfileBio}
              profileImageUrl={profileImageUrl}
              setProfileImageUrl={setProfileImageUrl}
              userOrganization={userOrganization}
              isSavingProfile={isSavingProfile}
              setIsSavingProfile={setIsSavingProfile}
              onSaveProfile={handleSaveProfile}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      <EventModals
        showClubDetailModal={showClubDetailModal}
        setShowClubDetailModal={setShowClubDetailModal}
        showCreateEventModal={showCreateEventModal}
        setShowCreateEventModal={setShowCreateEventModal}
        selectedClub={selectedClub}
        setSelectedClub={setSelectedClub}
        clubEvents={clubEvents}
        setClubEvents={setClubEvents}
        availableClubs={availableClubs}
        selectedEvent={selectedEvent}
        setSelectedEvent={setSelectedEvent}
        setCurrentPage={setCurrentPage}
        userClubs={userClubs}
        setUserClubs={setUserClubs}
        userOrganization={userOrganization}
        eventDate={eventDate}
        setEventDate={setEventDate}
      />

      <CreateClubModal
        showCreateClubModal={showCreateClubModal}
        setShowCreateClubModal={setShowCreateClubModal}
        hasOrganization={hasOrganization}
        userClubs={userClubs}
        setUserClubs={setUserClubs}
        setHasClubMembership={setHasClubMembership}
        availableClubs={availableClubs}
        setAvailableClubs={setAvailableClubs}
      />
    </div>
  )
}
```

## 🎯 Benefits of This Refactoring

1. **Maintainability**: Each component is now ~100-300 lines instead of 1600+ lines
2. **Reusability**: Components can be reused in other parts of the app
3. **Testability**: Easier to test individual components
4. **Readability**: Clear separation of concerns
5. **Performance**: Can optimize individual components
6. **Collaboration**: Multiple developers can work on different components
7. **Exact Same UI**: All styling and behavior preserved

## 🔄 Next Steps for Database Integration

Now that components are modular, you can easily:

1. **Replace localStorage with API calls** in each component
2. **Add useDashboardData hook** to each component that needs it
3. **Implement pagination** in HistorySection
4. **Add loading states** to each component independently
5. **Add error handling** per component

Each component is now ready to be migrated to use the MongoDB backend via the `useDashboardData` hook we created earlier!

## 📝 Missing State Variables

You'll need to declare these state variables in the main page (they're currently used but not shown in the summarized file):

```typescript
const [hasClubMembership, setHasClubMembership] = useState(false)
const [userClubs, setUserClubs] = useState<string[]>([])
const [availableClubs, setAvailableClubs] = useState<Array<{name: string, members: number, color: string, logoUrl?: string}>>([])
const [clubEvents, setClubEvents] = useState<Record<string, Array<{id: string, name: string, date: string}>>>({})
const [userCreatedOrgs, setUserCreatedOrgs] = useState<Array<{id: string, name: string, city: string, state: string, rank: number, logoUrl?: string}>>([])
const [generationHistory, setGenerationHistory] = useState<HistoryItem[]>([])
```

All components are created and ready to use! 🎉
