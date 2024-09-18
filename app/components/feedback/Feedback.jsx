import styles from './feedback.module.css';
import { useState } from 'react';
import apiUsuarios from '../../service/usuario';


const Feedback = (localParametro) => {
    const [local, setLocal] = useState("SENAI");
    const [nota, setNota] = useState(0);
    const [observacao, setObservacao] = useState('');
    

    const handleSubmit = async (e) => {
        e.preventDefault();
        const usuario = {
            local,
            nota,
            observacao,
            data: new Date().toISOString().split('T')[0], // Data automática no formato YYYY-MM-DD
        };

        try {
            await apiUsuarios.createUsuario(usuario);
            alert('Feedback enviado com sucesso!');
        } catch (error) {
            console.error("Erro ao enviar feedback:", error.message);
            alert('Erro ao enviar feedback.');
        }
    };

    return (
        <>
        <div className={styles.fundo}>
        <div className={styles.card}>
            <h2 className={styles.text}>Em uma escala de 0 a 10, o quanto você recomendaria nosso serviço?</h2>
            <div className={styles.scale}>
                {[...Array(11).keys()].map((num) => (
                    <button
                        key={num}
                        className={num === nota ? styles.selected : styles.notSelected}
                        onClick={() => setNota(num)}
                    >
                        {num}
                        
                    </button>
                ))}
            </div>
            <div className={styles.avaliContainer}>
                    <p className={styles.avali01}>Não Satisfeito</p>
                    <p className={styles.avali}>Satisfeito</p>
                </div>
            <div>
                  <h2 className={styles.text02}>Fale como podemos melhorar (opcional)</h2>
            </div>
          
            <textarea
                className={styles.textarea}
                placeholder="..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
            />
            <div>
                 <button className={styles.submit} onClick={handleSubmit} >Enviar</button>
            </div>
           
        </div>
        </div>
        
         </>
    );
}
       
       

export default Feedback;
