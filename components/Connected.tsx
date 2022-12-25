import {
    FC,
    MouseEventHandler,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    Button,
    Container,
    Heading,
    HStack,
    Text,
    VStack,
    Image,
} from '@chakra-ui/react';
import { ArrowForwardIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/router';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
    CandyMachine,
    CandyMachineV2,
    Metaplex,
    PublicKey,
    walletAdapterIdentity,
} from '@metaplex-foundation/js';

const Connected: FC = () => {
    const router = useRouter();
    const walletAdapter = useWallet();
    const { connection } = useConnection();

    const [candyMachine, setCandyMachine] = useState<CandyMachineV2>();
    const [isMinting, setIsMinting] = useState(false);

    const metaplex = useMemo(() => {
        return Metaplex.make(connection).use(
            walletAdapterIdentity(walletAdapter)
        );
    }, [connection, walletAdapter]);

    useEffect(() => {
        if (!metaplex) return;

        metaplex
            .candyMachinesV2()
            .findByAddress({
                address: new PublicKey(
                    'AdvvQtYGdXbeRJDdmM91kwW6Px4KLvSVFbFq1APgcrDt'
                ),
            })

            .then((candyMachine) => {
                console.log(candyMachine);
                setCandyMachine(candyMachine);
            })
            .catch((error) => {
                alert(error);
            });
    }, [metaplex]);

    const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
        async (event) => {
            if (event.defaultPrevented) return;
            if (!walletAdapter.connected || !candyMachine) return;

            try {
                setIsMinting(true);
                const nft = await metaplex
                    .candyMachinesV2()
                    .mint({ candyMachine });

                console.log(nft);
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
                        <Text as="b"> $BLD</Text> Use your{' '}
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
                <HStack>
                    <Text>mint buildoor</Text>
                    <ArrowForwardIcon />
                </HStack>
            </Button>
        </VStack>
    );
};

export default Connected;
