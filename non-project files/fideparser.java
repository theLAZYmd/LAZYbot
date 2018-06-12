import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import java.io.IOException;
import java.util.ArrayList;

/**
 * Created by sachin on 7/4/16.
 */
public class FIDE{

    Document doc;
    ArrayList<ChessPersonObject> personObjects;
    ArrayList <TopPlayerObject>topPlayerObjects;
    FIDE (){
        personObjects=new ArrayList<>();
        topPlayerObjects=new ArrayList<>();
    }
    public ArrayList <ChessPersonObject> search (String searchString,Integer PageNo) throws IOException {
        personObjects.clear();
        Integer offset;
        if (PageNo>1){
        offset=(PageNo-1)*49;
        }else{
        offset=0;
        }
        doc= Jsoup.connect("http://ratings.fide.com/search.phtml?search="+searchString+"&offset="+offset+"&front=0").get();
        return ParseResult();
    }
    public  ArrayList <TopPlayerObject> getTop100 () throws IOException {
        topPlayerObjects.clear();
        doc = Jsoup.connect("http://ratings.fide.com/top.phtml?list=men").get();
//        System.out.println(doc.body());
        Element table = doc.select("table").get(4); //select the first table.
//        System.out.println(table.text());
        Elements rows = table.select("tr");
        for (int i = 1; i < rows.size(); i++) { //first row is the col names so skip it.
            Element row = rows.get(i);
            Elements cols = row.select("td");
                TopPlayerObject topPlayerObject = new TopPlayerObject(cols.get(1).text(), cols.get(2).text(), cols.get(3).text(), cols.get(4).text(), cols.get(5).text(), cols.get(6).text());
                topPlayerObjects.add(topPlayerObject);
                System.out.println(topPlayerObject.getName());
        }
        return topPlayerObjects;
    }

    public ArrayList <ChessPersonObject> ParseResult(){
        Element table = doc.select("table").get(0); //select the first table.
        Elements rows = table.select("tr");
        for (int i = 1; i < rows.size(); i++) { //first row is the col names so skip it.
            Element row = rows.get(i);
            Elements cols = row.select("td");
            if (cols.size()==13) {
                ChessPersonObject personObject = new ChessPersonObject(cols.get(0).text(), cols.get(1).text(), cols.get(2).text(), cols.get(3).text(), cols.get(4).text(), cols.get(5).text(), cols.get(6).text(), cols.get(7).text(), cols.get(8).text(), cols.get(9).text(), cols.get(10).text(), cols.get(11).text(), cols.get(12).text());
                personObjects.add(personObject);
                System.out.println(cols.get(1).text());
            }
        }
        return personObjects;
    }

}
