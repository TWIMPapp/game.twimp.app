import ItemsDialog from '@/components/ItemsDialog';
import { Sentiment } from '@/typings/Sentiment.enum';
import { InventoryItem } from '@/typings/inventoryItem';
import { useEffect, useState } from 'react';
import JournalImage from '../../../assets/images/journal.jpg';
// import JournalDialog from '@/components/JournalDialog';
import { APIService } from '@/services/API';
import { Endpoint } from '@/typings/Endpoint.enum';
import QueryParams from '@/typings/QueryParams';
import Loading from '@/components/Loading';

export const sentimentBorderColour = (sentiment: Sentiment): string => {
  return {
    [Sentiment.Positive]: 'border-green-400',
    [Sentiment.Negative]: 'border-red-400',
    [Sentiment.Neutral]: 'border-yellow-400'
  }[sentiment];
};

const journalItem: InventoryItem = {
  title: 'Journal',
  thumb_url: JournalImage.src,
  image_url: JournalImage.src
};

const MAX_INVENTORY_SLOTS = 14;

interface ItemsResponse {
  ok: boolean;
  items: InventoryItem[];
}

const InventoryTab = ({
  setItems,
  refreshData
}: {
  setItems: InventoryItem[];
  refreshData: boolean;
}) => {
  const [collectedItems, setCollectedItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [openItem, setItemOpen] = useState<boolean>(false);
  const [openJournal, setJournalOpen] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);

  const ItemsAPI = new APIService(Endpoint.Items);

  const handleItemClose = () => {
    setItemOpen(false);
  };

  const handleJournalClose = () => {
    setJournalOpen(false);
  };

  useEffect(() => {
    setCollectedItems([]);
    setSelectedItem(null);
    setItemOpen(false);
    setJournalOpen(false);
    setLoaded(false);

    const fetchData = async () => {
      const _params = Object.fromEntries(
        new URLSearchParams(window.location.search)
      ) as unknown as QueryParams;
      const data = await ItemsAPI.get<ItemsResponse>(_params);

      if (data?.ok) {
        const emptySlotsCount =
          Number(MAX_INVENTORY_SLOTS - (data?.items ?? []).length) > 0
            ? Number(MAX_INVENTORY_SLOTS - (data?.items ?? []).length)
            : 0;
        setCollectedItems([...data?.items, ...new Array(emptySlotsCount).fill({})]);
        setLoaded(true);
      }
    };

    if (setItems.length === 0) {
      fetchData();
    } else {
      setCollectedItems(
        [...setItems, ...new Array(MAX_INVENTORY_SLOTS - (setItems ?? []).length).fill({})] ?? []
      );
      setLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshData]);

  return (
    <>
      {loaded ? (
        <div className="flex flex-wrap m-2 justify-center">
          {/* <div
            key={journalItem.title}
            className="w-24 h-24 border-4 m-2 rounded-xl flex items-center justify-center cursor-pointer bg-center bg-no-repeat bg-cover"
            style={{ backgroundImage: `url(${journalItem.thumb_url})` }}
            onClick={() => setJournalOpen(true)}
          ></div> */}
          {collectedItems.map((item) => (
            <div
              key={item?.title ?? Math.random()}
              className={`w-24 h-24 border-4 m-2 rounded-xl flex items-center justify-center cursor-pointer bg-center bg-no-repeat  bg-cover ${
                item?.sentiment ? sentimentBorderColour(item?.sentiment) : ''
              }`}
              style={item.thumb_url ? { backgroundImage: `url(${item.thumb_url})` } : {}}
              onClick={() => {
                if (!item.title) return;
                setSelectedItem(item);
                setItemOpen(true);
              }}
            ></div>
          ))}
        </div>
      ) : (
        <Loading />
      )}
      {selectedItem && (
        <ItemsDialog
          items={[selectedItem]}
          open={openItem}
          handleClose={handleItemClose}
          singleItem={true}
        ></ItemsDialog>
      )}
      {/* {openJournal && <JournalDialog open={openJournal} handleClose={handleJournalClose} />} */}
    </>
  );
};

export default InventoryTab;
