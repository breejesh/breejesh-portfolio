---
title: "सोशल नेटवर्क (Social Network): प्लैनेटरी स्केल पर द्विदिशीय BFS पाथ सर्च (सीटीसीआई ९.२)"
description: "द्विदिशीय (Bidirectional) BFS और वितरित शार्डिंग का उपयोग करके अरबों उपयोगकर्ताओं के सोशल ग्राफ पर O(k^(d/2)) समय में दो लोगों के बीच सबसे छोटे कनेक्शन पथ की खोज।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-9-2-social-network.webp
previewImage: /assets/images/ctci-9-2-social-network.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** आप एक बहुत बड़े सोशल नेटवर्क (Facebook, LinkedIn) के लिए डेटा संरचनाओं और एल्गोरिदम को कैसे डिज़ाइन करेंगे? बताएं कि आप दो लोगों के बीच कनेक्शन / सबसे छोटा रास्ता (उदा. मैं $\to$ बॉब $\to$ सुसान $\to$ जेसन $\to$ आप) कैसे खोजेंगे।
> * **मुख्य समाधान:** **वितरित शार्डिंग + द्विदिशीय (Bidirectional) BFS**: (१) $k \approx 100$ दोस्तों और $d \approx 6$ दूरी के साथ पारंपरिक एक-दिशीय BFS $O(k^d) = 100^6 = 10^{12}$ नोड्स की खोज करता है; (२) द्विदिशीय BFS स्रोत और गंतव्य दोनों से एक साथ खोज शुरू करता है और बीच में मिलता है, जिससे केवल **$O(2 \cdot k^{d/2}) = 2 \cdot 100^3 = 2 \times 10^6$ नोड्स** का मूल्यांकन होता है (५,००,००० गुना गति!); (३) डेटाबेस आरपीसी (RPC) कॉल्स को कम करने के लिए `ServerID` द्वारा बैच क्वेरीज़ की जाती हैं।
> * **रियल-वर्ल्ड सिस्टम:** लिंक्डइन "डिग्री ऑफ कनेक्शन" इंजन और फेसबुक टीएओ (Facebook TAO)।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ९.२) में पूछा गया है:

*"अरबों नोड्स वाले सोशल नेटवर्क पर दो उपयोगकर्ताओं के बीच सबसे छोटा मित्र संबंध मार्ग खोजने के लिए वितरित आर्किटेक्चर और एल्गोरिदम डिज़ाइन करें।"*

## २. द्विदिशीय BFS का गणितीय लाभ

मान लीजिए $k \approx 100$ औसत मित्र संख्या है और $d \approx 6$ पृथक्करण की डिग्री है:
* **एक-दिशीय BFS:** $k^d = 100^6 = 1,000,000,000,000$ नोड्स।
* **द्विदिशीय BFS:** $2 \times k^{d/2} = 2 \times 100^3 = 2,000,000$ नोड्स।

खोज क्षेत्र **५,००,००० गुना** कम हो जाता है।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Queue;

public class SocialNetworkBFS {
    public static class Person {
        private final int personID;
        private final List<Integer> friends = new ArrayList<>();

        public Person(int id) { this.personID = id; }
        public int getID() { return personID; }
        public List<Integer> getFriends() { return friends; }
        public void addFriend(int friendID) { friends.add(friendID); }
    }

    public static class PathNode {
        public final Person person;
        public final PathNode previousNode;

        public PathNode(Person p, PathNode prev) {
            this.person = p;
            this.previousNode = prev;
        }

        public List<Person> collapse(boolean startsWithRoot) {
            List<Person> path = new ArrayList<>();
            PathNode node = this;
            while (node != null) {
                if (startsWithRoot) path.add(0, node.person);
                else path.add(node.person);
                node = node.previousNode;
            }
            return path;
        }
    }

    public static class BFSData {
        public Queue<PathNode> toVisit = new LinkedList<>();
        public Map<Integer, PathNode> visited = new HashMap<>();

        public BFSData(Person root) {
            PathNode sourcePath = new PathNode(root, null);
            toVisit.add(sourcePath);
            visited.put(root.getID(), sourcePath);
        }

        public boolean isFinished() { return toVisit.isEmpty(); }
    }

    public static List<Person> findPathBiBFS(Map<Integer, Person> people, int source, int destination) {
        if (!people.containsKey(source) || !people.containsKey(destination)) return null;

        BFSData sourceData = new BFSData(people.get(source));
        BFSData destData = new BFSData(people.get(destination));

        while (!sourceData.isFinished() && !destData.isFinished()) {
            Person collision = searchLevel(people, sourceData, destData);
            if (collision != null) {
                return mergePaths(sourceData, destData, collision.getID());
            }

            collision = searchLevel(people, destData, sourceData);
            if (collision != null) {
                return mergePaths(sourceData, destData, collision.getID());
            }
        }
        return null;
    }

    private static Person searchLevel(Map<Integer, Person> people, BFSData primary, BFSData secondary) {
        int count = primary.toVisit.size();
        for (int i = 0; i < count; i++) {
            PathNode pathNode = primary.toVisit.poll();
            int personID = pathNode.person.getID();

            if (secondary.visited.containsKey(personID)) {
                return pathNode.person;
            }

            Person person = pathNode.person;
            for (int friendID : person.getFriends()) {
                if (!primary.visited.containsKey(friendID)) {
                    Person friend = people.get(friendID);
                    PathNode next = new PathNode(friend, pathNode);
                    primary.visited.put(friendID, next);
                    primary.toVisit.add(next);
                }
            }
        }
        return null;
    }

    private static List<Person> mergePaths(BFSData sourceData, BFSData destData, int collisionID) {
        PathNode one = sourceData.visited.get(collisionID);
        PathNode two = destData.visited.get(collisionID);

        List<Person> pathOne = one.collapse(true);
        List<Person> pathTwo = two.collapse(false);

        pathTwo.remove(0);
        pathOne.addAll(pathTwo);
        return pathOne;
    }
}
```

## जटिलता और आर्किटेक्चर विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| खोज समय | `O(k^(d/2))` | मध्य बिंदु पर टकराव, $10^{12}$ नोड्स को घटाकर $2 \times 10^6$ करना। |
| सहायक मेमोरी | `O(k^(d/2))` | विज़िट किए गए नोड्स और कतार मेमोरी। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: वितरित ग्राफ स्टोर (Facebook TAO)

१. **`ServerID` द्वारा पार्टिशनिंग:** मित्र सूचियों को सर्वर नोड्स में विभाजित किया जाता है। आरपीसी कॉल्स को कम करने के लिए बैच क्वेरीज़ की जाती हैं।
२. **म्यूचुअल फ्रेंड्स कैशिंग:** रेडिस सेट इंटरसेक्शन (`SINTER`) द्वारा २-डिग्री संबंधों का त्वरित मूल्यांकन।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **कोई संबंध मार्ग नहीं:** कतार खाली होने पर सुरक्षित समापन।
२. **स्रोत और गंतव्य समान होना:** स्रोत नोड को सीधे लौटाना।
