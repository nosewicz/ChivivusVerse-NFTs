import { Contract, providers, utils } from "ethers"
import Head from "next/head"
import React, { useEffect, useRef, useState } from "react"
import Web3Modal from "web3modal"
import { abi, NFT_CONTRACT_ADDRESS } from "../constants"
import Image from 'next/image'
import rufus from '../public/chivivus/rufus-1.png'
import bart from '../public/chivivus/bart-4.png'
import saz from '../public/chivivus/saz-2.png'
import chiv from '../public/chivivus/chiv-3.png'

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false)
  const [presaleStarted, setPresaleStarted] = useState(false)
  const [presaleEnded, setPresaleEnded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0")
  const web3ModalRef = useRef()

  const presaleMint = async () => {
    try {
      const signer = await getProviderOrSigner(true)
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer)

      const tx = await nftContract.presaleMint({value: utils.parseEther("0.025")})
      setLoading(true)
      await tx.wait()
      setLoading(false)
      window.alert("You successfully minted a ChivivusVerse NFT!")
    } catch (err) {
      console.error(err)
    }
  }

  const publicMint = async () => {
    try {
      const signer = await getProviderOrSigner(true)
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer)

      const tx = await nftContract.mint({value: utils.parseEther("0.025")})
      setLoading(true)
      await tx.wait()
      setLoading(false)
      window.alert("You successfully minted a ChivivusVerse NFT!")
    } catch (err) {
      console.error(err)
    }
  }

  const connectWallet = async () => {
    try {
      await getProviderOrSigner()
      setWalletConnected(true)
    } catch (err) {
      console.error(err)
    }
  }

  const startPresale = async () => {
    try {
      const signer = await getProviderOrSigner(true)
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer)

      const tx = await nftContract.startPresale()
      setLoading(true)
      await tx.wait()
      setLoading(false)
      //set presale started to true
      await checkIfPresaleStarted()
    } catch (err) {
      console.error(err)
    }
  }

  const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProviderOrSigner()
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider)

      const _presaleStarted = await nftContract.presaleStarted()
      if(!_presaleStarted) {
        await getOwner()
      }
      setPresaleStarted(_presaleStarted)
      return _presaleStarted
    } catch (err) {
      console.error(err)
      return false
    }
  }

  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner()
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider)

      const _presaleEnded = await nftContract.presaleEnded()
      // _presaleEnded is a Big Number, so we are using the lt(less than function) instead of `<`
      // Date.now()/1000 returns the current time in seconds
      // We compare if the _presaleEnded timestamp is less than the current time
      // which means presale has ended
      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000))
      if (hasEnded) {
        setPresaleEnded(true)
      } else {
        setPresaleEnded(false)
      }
      return hasEnded
    } catch (err) {
      console.error(err)
      return false
    }
  }

  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner()
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider)
      const _owner = await nftContract.owner()
      const signer = await getProviderOrSigner(true)
      const address = await signer.getAddress()
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getTokenIdsMinted = async () => {
    try {
      const provider = await getProviderOrSigner()
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider)
      const _ids = await nftContract.tokenIds()
      setTokenIdsMinted(_ids.toString())
    } catch (err) {
      console.error(err)
    }
  }

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect()
    const web3Provider = new providers.Web3Provider(provider)

    const { chainId } = await web3Provider.getNetwork()
    if (chainId !== 4) {
      window.alert("change the network to Rinkeby")
      throw new Error("Change network to Rinkeby")
    }

    if (needSigner) {
      const signer = web3Provider.getSigner()
      return signer
    }
    return web3Provider
  }

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      })
      connectWallet()

      const _presaleStarted = checkIfPresaleStarted()
      if (_presaleStarted) {
        checkIfPresaleEnded()
      }

      getTokenIdsMinted()

      //set interval to check if presale has ended every 5 seconds
      const presaleEndedInterval = setInterval(async function () {
        const _presaleStarted = await checkIfPresaleStarted()
        if (_presaleStarted) {
          const _presaleEnded = await checkIfPresaleEnded()
          if (_presaleEnded) {
            clearInterval(presaleEndedInterval)
          }
        }
      }, 5 * 1000)

      //get number of token minted every 5 sec
      setInterval(async function () {
        await getTokenIdsMinted()
      }, 5 * 1000)
    }
  }, [walletConnected])

  const renderButton = () => {
    if (!walletConnected) {
      return (
        <button className="bg-violet-500 hover:bg-violet-700 text-white font-bold py-2 px-4 rounded text-center" onClick={connectWallet}>Connect your wallet</button>
      )
    }

    if (loading) {
      return (
        <button className="bg-violet-500 hover:bg-violet-700 text-white font-bold py-2 px-4 rounded text-center">Loading...</button>
      )
    }

    if (isOwner && !presaleStarted) {
      return (
        <button className="bg-violet-500 hover:bg-violet-700 text-white font-bold py-2 px-4 rounded text-center" onClick={startPresale}>Start Presale!</button>
      )
    }

    if (!presaleStarted) {
      return (
        <div>
          <p className="my-4">Presale has not yet started!</p>
        </div>
      )
    }

    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <p className="my-4">Presale has started. If you are on the whitelist you may mint.</p>
          <button className="bg-violet-500 hover:bg-violet-700 text-white font-bold py-2 px-4 rounded text-center" onClick={presaleMint}>Mint 🚀 (0.025 ETH)</button>
        </div>
      )
    }

    if (presaleStarted && presaleEnded) {
      return (
        <button className="bg-violet-500 hover:bg-violet-700 text-white font-bold py-2 px-4 rounded text-center" onClick={publicMint}>Mint 🚀 (0.025 ETH)</button>
      )
    }
  }

  return (
    <>
      <Head>
        <title>ChivivusVerse NFT Collection</title>
        <meta name="description" content="Welcome to the ChivivusVerse NFT collection. Mint yours today!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <script>0</script>
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold">ChivivusVerse NFTs</h1>
        <p className="my-4">Welcome to the ChivivusVerse. In order to join, purchase one of our ChivivusVerse NFTs.</p>
        <p className="my-4">Owning an ChivivusVerse NFT will give access to future ChivivusVerse projects like our ICO and DAO. Plus you&#39;ll be part of an ultra-exclusive club.</p>
        <p className="my-4">Mint price is just 0.025 ETH</p>
        {renderButton()}
        <p>{tokenIdsMinted}/20 have been minted</p>
        <div className="flex justify-center my-8">
          <div>
            <Image src={rufus} alt="rufus. CHivivusVerse NFT Collection" />
          </div>
          <div>
            <Image src={bart} alt="bartholomew. CHivivusVerse NFT Collection" />
          </div>
          <div>
            <Image src={saz} alt="sazafraz. CHivivusVerse NFT Collection" />
          </div>
          <div>
            <Image src={chiv} alt="Chivivus Man. CHivivusVerse NFT Collection" />
          </div>
        </div>
        <h3 className="text-3xl font-bold">RoadMap</h3>
        <div className="flex justify-center">
          <div className="p-3">
            <h4 className="text-xl font-bold">Whitelist</h4>
            <p>Sign up for the Chivivus Universe Whitelist to ensure your access into the ChivivusVerse!</p>
            <p className="text-center mt-6"><a href="https://chiv-whitelist.vercel.app/" target="_blank" rel="noreferrer"><button className="bg-teal-400 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded text-center">Sign Up</button></a></p>
          </div>
          <div className="p-3">
            <h4 className="text-xl font-bold">NFT Collection</h4>
            <p>Cement your membership in the ChivivusVerse buy minting one of our Limited Edition NFTs. Limited to only 20!</p>
            <p className="text-center mt-6"><a href="https://testnets.opensea.io/collection/chivivus-nfts-jp2gp2wnbk" target="_blank" rel="noreferrer"><button className="bg-sky-400 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded text-center">OpenSea</button></a></p>
          </div>
          <div className="p-3">
            <h4 className="text-xl font-bold">ChivCoin</h4>
            <p>The official ERC-20 token for the ChivivusVerse. Claimable airdrop for all ChivivusVerse NFT Collection holders. </p>
            <p className="text-center mt-6"><a href="https://chiv-coin.vercel.app/" target="_blank" rel="noreferrer"><button className="bg-gray-300 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded text-center cursor-not-allowed">Claim Tokens</button></a></p>
          </div>
          <div className="p-3">
            <h4 className="text-xl font-bold">ChivDAO</h4>
            <p>The future of the ChivivusVerse is in your hands! All community members will be able to decide what the ChivivusVerse does next.</p>
            <p className="text-center mt-6"><button className="bg-gray-300 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded text-center cursor-not-allowed">Coming Soon</button></p>
          </div>
        </div>
      </div>
      <footer className="text-center py-6 border-t mt-4">
        <p className="">A <a href="https://twitter.com/YipsCT" target="blank" className="border-b border-gray-500">@YipsCT</a> Project.</p>
        <p className="">I&#39;m looking to do Web3 as a job. Consider Me.</p>
      </footer>
    </>
  )
}