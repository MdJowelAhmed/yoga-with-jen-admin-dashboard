import React from 'react'
import { Switch, Modal, message } from 'antd'
import { 
  useGetLeaderboardDataQuery, 
  useLeaderboardStatusGlobalUpdateMutation,
  useLeaderboardGlobalStatusQuery
} from '../../redux/apiSlices/leaderboardApi'
import Spinner from '../../components/common/Spinner'

const Leaderboard = () => {
  const { data: leaderboardDataResponse, isLoading: isLeaderboardLoading } = useGetLeaderboardDataQuery()
  const { data: globalStatusResponse, isLoading: isStatusLoading } = useLeaderboardGlobalStatusQuery()
  const [updateStatus] = useLeaderboardStatusGlobalUpdateMutation()

  const leaderboardIsShown = globalStatusResponse?.data?.leaderboardIsShown ?? false

  const handleToggle = (checked) => {
    const action = checked ? 'Turn On' : 'Turn Off'
    const actionText = checked ? 'show' : 'hide'
    
    Modal.confirm({
      title: 'Confirm Leaderboard Status',
      content: `Are you sure you want to ${actionText} the leaderboard?`,
      okText: action,
      cancelText: 'Cancel',
      okButtonProps: {
        style: {
          backgroundColor: '#CA3939',
          borderColor: '#CA3939',
          color: '#fff',
        },
      },
      cancelButtonProps: {
        style: {
          borderColor: '#000',
          color: '#000',
        },
      },
      onOk: async () => {
        try {
          await updateStatus().unwrap()
          message.success(`Leaderboard ${actionText} successfully`)
        } catch (error) {
          console.error('Failed to update leaderboard status:', error)
          message.error('Failed to update leaderboard status')
        }
      },
    })
  }

  if (isLeaderboardLoading || isStatusLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    )
  }

  const leaderboardData = leaderboardDataResponse?.data || {}

  const LeaderboardCard = ({ title, data, scoreKey }) => {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary px-6 py-4">
          <h3 className="text-white text-lg font-semibold">{title}</h3>
        </div>
        
        {/* Table */}
        <div className="p-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-600 font-semibold">#</th>
                <th className="text-left py-3 px-4 text-gray-600 font-semibold">User</th>
                <th className="text-right py-3 px-4 text-gray-600 font-semibold">Score</th>
              </tr>
            </thead>
            <tbody>
              {data && data.length > 0 ? (
                data.map((item, index) => (
                  <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-700">{index + 1}</td>
                    <td className="py-3 px-4 text-gray-700">{item.name}</td>
                    <td className="py-3 px-4 text-gray-700 text-right">{item[scoreKey] || 0}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="py-4 px-4 text-center text-gray-500">
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header with Title and Toggle */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Leaderboard</h1>
        <div className="flex items-center gap-3">
          <span className="text-gray-700">Status:</span>
          <Switch
            checked={leaderboardIsShown}
            onChange={handleToggle}
            className={leaderboardIsShown ? 'leaderboard-switch-on' : 'leaderboard-switch-off'}
          />
        </div>
      </div>

      {/* Three Leaderboard Cards - Only show when leaderboardIsShown is true */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <LeaderboardCard
            title="Total Time (Minutes)"
            data={leaderboardData.topByMilestones}
            scoreKey="matTime"
          />
          <LeaderboardCard
            title="Streaks (Login Count)"
            data={leaderboardData.topByLoginCount}
            scoreKey="loginCount"
          />
          <LeaderboardCard
            title="Sessions Completed"
            data={leaderboardData.topByCompletedSessions}
            scoreKey="completedSessionsCount"
          />
        </div>
   

      {/* Message when leaderboard is hidden */}
      {/* {!leaderboardIsShown && (
       <div className="flex items-center justify-center min-h-[calc(100vh-300px)]">
         <div className="flex items-center justify-center h-[100px] max-w-md mx-auto p-6 shadow-lg rounded-lg">
          <p className=" text-lg text-center">Leaderboard is currently hidden, Please turn it on to show the leaderboard</p>
        </div>
       </div>
      )} */}
    </div>
  )
}

export default Leaderboard