"use client"; 

import CommerceLayout from "@/layout/CommerceLayout";
import { setWalletAddress, setWalletConnected } from "@/reducers/userSlice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useAccount } from "wagmi";
import APIService from "@/http/api_service";

export default function Home() {
  const dispatch = useDispatch();
  const { address, isConnected } = useAccount();

  // useEffect(() => { 
  //   if(isConnected){
  //     dispatch(setWalletAddress(address));
  //     dispatch(setWalletConnected(true));
  //   }
  // }, [address, isConnected]);
  
  return (
    <>
      <CommerceLayout />
    </>
  );
}
