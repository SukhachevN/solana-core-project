import {
    Button,
    Container,
    Heading,
    VStack,
    Text,
    HStack,
    Image,
} from '@chakra-ui/react';
import {
    FC,
    MouseEventHandler,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { PublicKey } from '@solana/web3.js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
    Metaplex,
    walletAdapterIdentity,
    CandyMachine,
    CandyMachineV2,
} from '@metaplex-foundation/js';
import { useRouter } from 'next/router';

const Connected: FC = () => {
    const { connection } = useConnection();
    const walletAdapter = useWallet();
    const [candyMachine, setCandyMachine] = useState<CandyMachineV2>();
    const [isMinting, setIsMinting] = useState(false);

    const metaplex = useMemo(() => {
        return Metaplex.make(connection).use(
            walletAdapterIdentity(walletAdapter)
        );
    }, [connection, walletAdapter]);

    useEffect(() => {
        handleInitialLoad();
    }, [metaplex, walletAdapter]);

    const handleInitialLoad = useCallback(async () => {
        if (!metaplex || !walletAdapter.publicKey) return;

        try {
            const candymachine = await metaplex
                .candyMachinesV2()
                .findByAddress({
                    address: new PublicKey(
                        process.env.NEXT_PUBLIC_CANDY_MACHINE_ADDRESS ?? ''
                    ),
                });

            const nfts = await metaplex
                .nfts()
                .findAllByOwner({ owner: walletAdapter.publicKey });

            const nft = nfts.find(
                (nft) =>
                    nft.collection?.address.toBase58() ===
                    candymachine.collectionMintAddress?.toBase58()
            );

            if (nft) {
                const metadata = await (await fetch(nft.uri)).json();
                router.push(
                    `/stake?mint=${nft.address}&imageSrc=${metadata?.image}`
                );
            }

            setCandyMachine(candymachine);
        } catch (error) {
            alert(error);
        }
    }, [metaplex, walletAdapter, candyMachine]);

    const router = useRouter();

    const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
        async (event) => {
            if (event.defaultPrevented) return;

            if (!walletAdapter.connected || !candyMachine) {
                return;
            }

            try {
                setIsMinting(true);
                const nft = await metaplex.candyMachinesV2().mint({
                    candyMachine,
                });

                router.push(`/newMint?mint=${nft.nft.address.toBase58()}`);
            } catch (error) {
                alert(error);
            } finally {
                setIsMinting(false);
            }
        },
        [metaplex, walletAdapter, candyMachine]
    );

    return (
        <VStack spacing={20}>
            <Container>
                <VStack spacing={8}>
                    <Heading
                        color="white"
                        as="h1"
                        size="2xl"
                        noOfLines={1}
                        textAlign="center"
                    >
                        Welcome Buildoor.
                    </Heading>

                    <Text color="bodyText" fontSize="xl" textAlign="center">
                        Each buildoor is randomly generated and can be staked to
                        receive
                        <Text as="b"> $BLD</Text>. Use your{' '}
                        <Text as="b"> $BLD</Text> to upgrade your buildoor and
                        receive perks within the community!
                    </Text>
                </VStack>
            </Container>

            <HStack spacing={10}>
                <Image src="avatar1.png" alt="" />
                <Image src="avatar2.png" alt="" />
                <Image src="avatar3.png" alt="" />
                <Image src="avatar4.png" alt="" />
                <Image src="avatar5.png" alt="" />
            </HStack>

            <Button
                bgColor="accent"
                color="white"
                maxW="380px"
                onClick={handleClick}
                isLoading={isMinting}
            >
                <Text>mint buildoor</Text>
            </Button>
        </VStack>
    );
};

export default Connected;
