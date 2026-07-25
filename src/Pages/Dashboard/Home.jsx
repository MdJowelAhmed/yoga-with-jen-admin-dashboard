import React from "react";
import { FaCalendarDay, FaDollarSign } from "react-icons/fa";
import { HiMiniUsers } from "react-icons/hi2";
import { MdArrowUpward, MdOutlineHome } from "react-icons/md";
import { PiHouseLine } from "react-icons/pi";
import { Bar } from "react-chartjs-2";
import LineChart from "./LineChart";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import OrderTable from "../../components/home/OrderTable";
import { useGetStatisticsQuery } from "../../redux/apiSlices/homeSlice";
import Spinner from "../../components/common/Spinner";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Home = () => {

  const { data, isLoading } = useGetStatisticsQuery()



    if (isLoading) {
      return (
        <div className="flex items-center justify-center ">
         <Spinner />
        </div>
      );
    }

  return (
    <div className="">
      <div className="flex flex-col xl:flex-row  gap-10   rounded-lg">
        {/* Line Chart Section */}
        <div className="w-full xl:flex-1 xl:w-2/3 border border-[#DE5555]  rounded-lg p-6 ">
          <h2 className=" text-2xl font-bold text-black mb-4">Total Revenue</h2>
          <LineChart />
        </div>
        {/* Card Section */}
        <div className="w-full xl:w-1/3  xl:h-[340px] bg-gradient-to-r from-primary  to-secondary p-6 rounded-lg">
          <div className="flex justify-between mb-4 text-white">
            <h2 className=" mt-4"> Statistics</h2>
            <p className=" border-2  py-2 px-4 rounded-lg">Last 7 Days</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-2 gap-3 h-28 xl:h-[240px]">
            <div className="bg-white rounded-lg py-0 px-2 flex items-center justify-center gap-4">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-center  font-bold mb-3">Total Earn</h2>
                  <h3 className="text-primary text-2xl text-center font-bold">
                    $ {data?.totalEarn}
                  </h3>
                </div>
                
              </div>
            </div>

            <div className="bg-white rounded-lg py-0 px-2 flex items-center justify-center gap-4">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-center  font-bold mb-3">Total Users</h2>
                  <h3 className="text-primary text-2xl text-center font-bold">
                    {data?.totalUsers}{" "}
                  </h3>
                </div>
                
              </div>
            </div>

            <div className="bg-white rounded-lg py-0 px-2 flex items-center justify-center gap-4">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-center  font-bold mb-3">Total Videos </h2>
                  <h3 className="text-primary text-2xl text-center font-bold">
                    {" "}
                    {data?.totalVideos}{" "}
                  </h3>
                </div>
                
              </div>
            </div>

            <div className="bg-white rounded-lg py-0 px-2 flex items-center justify-center gap-4">
              <div className="flex items-center  gap-3">
                <div>
                  <h2 className="text-center  font-bold mb-3">
                    Subscribers
                  </h2>
                  <h3 className="text-primary text-2xl text-center  font-bold">
                    {data?.totalSubscriptionsSell}{" "}
                  </h3>
                </div>
                
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className=" mt-16">
        <OrderTable />
      </div>
    </div>
  );
};

export default Home;
