"use client";
import Image from "next/image";
import Button from "../Button";
import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { coinbaseWallet } from "wagmi/connectors";
import { orbitron } from "@/fonts/fonts";
import { poppins } from "@/fonts/fonts";
import { useDispatch } from "react-redux";
import { setWalletAddress, setWalletConnected } from "@/reducers/userSlice";
import APIService from "@/http/api_service";

interface NavToolsProps {
  title?: string;
  isMenu?: boolean;
}

const NavTools: React.FC<NavToolsProps> = (props) => {
  const dispatch = useDispatch(); 
  const [buttonText, setButtonText] = useState("Connect Wallet");
  const { title, isMenu = false } = props;
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    if (isConnected) {
      const requestBody = { 
        wallet_address: address, 
      };
      APIService.createProfile(requestBody, (response: any, error: any) => {
        if(error){
          console.log(error, "#error"); 
        }
        console.log(response, "#response-data");
      })
      // @ts-ignore
      const short = `${address.slice(0, 5)}...${address.slice(-4)}`;
      setButtonText(short);
      dispatch(setWalletAddress(address));
      dispatch(setWalletConnected(true));
    } else {
      setButtonText("Connect Wallet");
    }
  }, [isConnected, address]);

  // Function to connect to Coinbase Wallet (Base Wallet)
  const handleConnectWallet = () => {
    // Try to connect to Coinbase Wallet first
    connect({ 
      connector: coinbaseWallet({
        appName: 'NFT Factory',
        appLogoUrl: 'https://avatars.githubusercontent.com/u/37784883',
        darkMode: true,
      })
    });
  };

  return (
    <>
      {isMenu ? (
        <div className="w-[90%] mx-auto flex justify-between">
          <h2 className={`${orbitron.className} text-2xl text-white`}>
            {title}
          </h2>
          <div className="flex flex-row gap-3 items-center">
            <button
              className="bg-gradient-linear rounded-md px-3 py-2 text-sm"
              onClick={async () => {
                await handleConnectWallet();
              }}
            >
              {buttonText}
            </button>
            <a href="/profile">
              <Image
                height={25}
                width={25}
                src={"/profile.svg"}
                alt={"profile"}
                style={{ cursor: "pointer" }}
              />
            </a>
          </div>
        </div>
      ) : (
        <>
          <button
            className="bg-gradient-linear rounded-md px-3 py-2 text-md"
            onClick={async () => {
              await handleConnectWallet();
            }}
          >
            {buttonText}
          </button>
          <a href="/profile">
            <Image
              height={25}
              width={25}
              src={"/profile.svg"}
              alt={"profile"}
              style={{ cursor: "pointer" }}
            />
          </a>
        </>
      )}
    </>
  );
};

export default NavTools;
